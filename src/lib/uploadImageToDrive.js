require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const FOLDER_PARENT_ID = process.env.GOOGLE_DRIVE_FOLDER_PARENT_ID;

async function uploadImageToDrive({ filesArray, folderName = 'conta-luz-client-image', userData = {} }) {

    if(!filesArray.length) return; 

    const oauth = new google.auth.OAuth2( CLIENT_ID, CLIENT_SECRET );
    oauth.setCredentials({ refresh_token: REFRESH_TOKEN });

    const drive = google.drive({
        version: "v3",
        auth: oauth,        
    })

    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [FOLDER_PARENT_ID],
    };

    const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id',
    });

    for await (const imagaData of filesArray) {
        drive.files.create({
            requestBody: {
                name: imagaData.filename,
                mimeType: imagaData.mimeType,
                parents: [folder.data.id]
            },
            media: {
                mimeType: imagaData.mimeType,
                body: fs.createReadStream(path.resolve(__dirname, '..', '..', 'tmp', 'uploads', imagaData.filename)),
            }
        });            
    }        

    userData.documentos = `https://drive.google.com/drive/folders/${folder.data.id}`;
    
}


module.exports = { uploadImageToDrive };