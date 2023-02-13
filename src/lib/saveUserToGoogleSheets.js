const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../config/cred.json'); 

async function saveUserToGoogleSheet({ userData, hasImage }) {
    const doc = new GoogleSpreadsheet('1LUIIiy152HLZYPi08pNGrmwJ0I6kdHSSF65MGztxwIo');
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const index = hasImage ? 1 : 0;
    const sheet = doc.sheetsByIndex[index]; 
        
    try {
        await sheet.addRow(userData);
    } catch (error) {
        console.log(error);        
    }
}


module.exports = { saveUserToGoogleSheet };