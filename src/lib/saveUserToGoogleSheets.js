require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('../config/cred.json');
const { JWT } = require('google-auth-library');

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function saveUserToGoogleSheet({ userData, hasImage }) {
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);  
  await doc.loadInfo();
  const index = hasImage ? 1 : 0;
  const sheet = doc.sheetsByIndex[index];
  await sheet.addRow(userData);
}

module.exports = { saveUserToGoogleSheet };
