const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    jidDecode,
    getContentType
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    } else return jid;
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_sales');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['SalesBot', 'Chrome', '1.0.0']
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            console.log('Connection closed, reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Sales Bot is online and connected!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message) return;
        if (msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const sender = decodeJid(from);

        // Extract message content
        const type = getContentType(msg.message);
        let body = '';
        if (type === 'conversation') body = msg.message.conversation;
        else if (type === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;
        else if (type === 'buttonsResponseMessage') body = msg.message.buttonsResponseMessage.selectedButtonId;
        else if (type === 'listResponseMessage') body = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        else if (type === 'templateButtonReplyMessage') body = msg.message.templateButtonReplyMessage.selectedId;

        require('./handler').handleMessage(sock, msg, from, sender, body);
    });

    return sock;
}

module.exports = { connectToWhatsApp };

if (require.main === module) {
    connectToWhatsApp();
}
