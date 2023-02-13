const { saveUserToGoogleSheet } = require('../lib/saveUserToGoogleSheets');

module.exports = {
    key: 'googleSheetJob',
    async handle({ data }) {
        const { userData, hasImage } = data;
        await saveUserToGoogleSheet({ userData, hasImage });
    }
}