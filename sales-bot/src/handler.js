const fs = require('fs');
const path = require('path');
const { readDatabase, writeDatabase, generateTTS } = require('./utils/dbUtils');
const settings = require('./config/settings.json');

// User session state (in-memory for this example, could be persisted to JSON)
const sessions = {};

const handleMessage = async (sock, msg, from, sender, body) => {
    try {
        const lowerBody = body ? body.toLowerCase() : "";
        const session = sessions[sender] || { step: 'IDLE' };

        // Global "menu" command to reset state
        if (lowerBody === 'menu') {
            session.step = 'IDLE';
            delete session.orderData;
        }

        switch (session.step) {
            case 'IDLE':
                await sendWelcome(sock, from);
                session.step = 'MAIN_MENU';
                break;

            case 'MAIN_MENU':
                if (lowerBody === 'view_products' || lowerBody === '🛍️ ver productos' || lowerBody === '1') {
                    await sendProductList(sock, from);
                } else if (lowerBody === 'view_prices' || lowerBody === '💰 ver precios' || lowerBody === '2') {
                    await sendPrices(sock, from);
                } else if (lowerBody === 'make_order' || lowerBody === '📦 hacer pedido' || lowerBody === '3') {
                    await startOrderFlow(sock, from, sender);
                } else if (lowerBody === 'talk_advisor' || lowerBody === '👨‍💼 hablar con asesor' || lowerBody === '4') {
                    await sock.sendMessage(from, { text: settings.advisorMessage });
                } else {
                    // Fallback to main menu if input is not recognized
                    await sendMainMenu(sock, from);
                }
                break;

            case 'ORDER_NAME':
                session.orderData = { name: body };
                await sock.sendMessage(from, { text: "🛍️ ¿Qué producto deseas ordenar? (Escribe el nombre o ID)" });
                session.step = 'ORDER_PRODUCT';
                break;

            case 'ORDER_PRODUCT':
                session.orderData.product = body;
                await sock.sendMessage(from, { text: "📍 Por favor, ingresa tu dirección de envío:" });
                session.step = 'ORDER_ADDRESS';
                break;

            case 'ORDER_ADDRESS':
                session.orderData.address = body;
                saveOrder(sender, session.orderData);
                await sock.sendMessage(from, { text: settings.orderConfirmation });
                session.step = 'IDLE';
                break;

            default:
                await sendMainMenu(sock, from);
                session.step = 'MAIN_MENU';
        }

        sessions[sender] = session;

    } catch (err) {
        console.error('Error in handleMessage:', err);
    }
};

const sendWelcome = async (sock, from) => {
    // Plus: Send a voice message greeting (TTS)
    try {
        const ttsPath = await generateTTS(`${settings.welcomeMessage}`, 'es');
        await sock.sendMessage(from, {
            audio: { url: ttsPath },
            mimetype: 'audio/mp4',
            ptt: true
        });
        // Optional: delete file after sending if needed, but for now we keep it in temp
    } catch (e) {
        console.error('TTS Error:', e);
    }

    // Attempting to send buttons
    const buttons = [
        { buttonId: 'view_products', buttonText: { displayText: '🛍️ Ver productos' }, type: 1 },
        { buttonId: 'view_prices', buttonText: { displayText: '💰 Ver precios' }, type: 1 },
        { buttonId: 'make_order', buttonText: { displayText: '📦 Hacer pedido' }, type: 1 },
        { buttonId: 'talk_advisor', buttonText: { displayText: '👨‍💼 Hablar con asesor' }, type: 1 }
    ];

    const buttonMessage = {
        text: `${settings.welcomeMessage}\n\n${settings.menuText}`,
        footer: settings.businessName,
        buttons: buttons,
        headerType: 1
    };

    try {
        await sock.sendMessage(from, buttonMessage);
    } catch (e) {
        // Fallback to text if buttons fail
        let text = `${settings.welcomeMessage}\n\n${settings.menuText}\n\n`;
        text += `1️⃣ Ver productos\n2️⃣ Ver precios\n3️⃣ Hacer pedido\n4️⃣ Hablar con asesor`;
        await sock.sendMessage(from, { text });
    }
};

const sendMainMenu = async (sock, from) => {
    await sendWelcome(sock, from);
};

const sendProductList = async (sock, from) => {
    const products = readDatabase('products.json');
    let text = `📦 *Catálogo de Productos - ${settings.businessName}*\n\n`;

    products.forEach(p => {
        text += `🔹 *${p.name}* (ID: ${p.id})\n`;
        text += `📝 ${p.description}\n`;
        text += `💰 Precio: ${settings.currency} ${p.price}\n\n`;
    });

    text += "Escribe 'menu' para volver atrás o selecciona una opción.";
    await sock.sendMessage(from, { text });
};

const sendPrices = async (sock, from) => {
    const products = readDatabase('products.json');
    let text = `💰 *Lista de Precios*\n\n`;

    products.forEach(p => {
        text += `💵 ${p.name}: *${settings.currency} ${p.price}*\n`;
    });

    text += "\nEscribe 'menu' para volver atrás.";
    await sock.sendMessage(from, { text });
};

const startOrderFlow = async (sock, from, sender) => {
    await sock.sendMessage(from, { text: "📝 Vamos a tomar tu pedido. Primero, ¿cuál es tu nombre?" });
    sessions[sender] = { step: 'ORDER_NAME', orderData: {} };
};

const saveOrder = (sender, orderData) => {
    const orders = readDatabase('orders.json');
    const newOrder = {
        id: `ORD-${Date.now()}`,
        sender,
        ...orderData,
        date: new Date().toISOString()
    };
    orders.push(newOrder);
    writeDatabase('orders.json', orders);
};

module.exports = { handleMessage };
