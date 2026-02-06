const settings = {
    botName: "Bot Zona de Charla",
    groupName: "Zona de Charla",
    prefix: ".",
    ownerNumbers: ["5491112345678"], // Replace with actual owner numbers
    admins: [],
    welcomeMessage: "🎉 *¡Bienvenido/a a Zona de Charla!* \nSomos una comunidad de amigos con juegos, risas y buen ambiente. \n\n👉 Preséntate con este formato: \n📸 Foto: \n👤 Nombre: \n🎂 Edad: \n🌍 País: \n♈ Signo zodiacal: \n💬 Algo sobre ti:",
    features: {
        antiLink: true,
        antiSpam: true,
        antiBots: true,
        antiFlood: true,
        autoWelcome: true,
        autoGames: true,
        userRegistration: true
    },
    rules: "1. No insultar.\n2. No enviar contenido +18.\n3. Respetar a todos los miembros.",
    floodLimit: 5,
    muteTime: 10 * 60 * 1000 // 10 minutes in milliseconds
};

module.exports = settings;
