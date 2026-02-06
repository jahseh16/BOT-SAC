const settings = require('../settings');

const handleWelcome = async (sock, anu) => {
    if (!settings.features.autoWelcome) return;
    const { id, participants, action } = anu;

    if (action === 'add') {
        for (const num of participants) {
            const welcomeMsg = settings.welcomeMessage;
            await sock.sendMessage(id, {
                text: welcomeMsg,
                mentions: [num]
            });
        }
    }
};

module.exports = { handleWelcome };
