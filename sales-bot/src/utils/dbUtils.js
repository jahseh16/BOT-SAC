const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');

/**
 * Reads a JSON file and returns its content.
 * @param {string} filename
 * @returns {any}
 */
const readDatabase = (filename) => {
    const filePath = path.join(__dirname, '..', 'database', filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

/**
 * Writes data to a JSON file.
 * @param {string} filename
 * @param {any} data
 */
const writeDatabase = (filename, data) => {
    const filePath = path.join(__dirname, '..', 'database', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

/**
 * Generates a TTS audio file and returns its path.
 * @param {string} text
 * @param {string} lang
 * @returns {Promise<string>}
 */
const generateTTS = (text, lang = 'es') => {
    return new Promise((resolve, reject) => {
        const gtts = new gTTS(text, lang);
        const fileName = `tts_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, '..', 'temp', fileName);

        if (!fs.existsSync(path.join(__dirname, '..', 'temp'))) {
            fs.mkdirSync(path.join(__dirname, '..', 'temp'));
        }

        gtts.save(filePath, (err) => {
            if (err) return reject(err);
            resolve(filePath);
        });
    });
};

module.exports = {
    readDatabase,
    writeDatabase,
    generateTTS
};
