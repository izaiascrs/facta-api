require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
// const creds = require('../config/cred.json'); 
const creds = require('../../cred.json'); 

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function saveUserToGoogleSheet({ userData, hasImage }) {
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const index = hasImage ? 1 : 0;
    const sheet = doc.sheetsByIndex[index];         
    await sheet.addRow(userData);    
}


module.exports = { saveUserToGoogleSheet };
