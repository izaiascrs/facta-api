const { uploadImageToDrive } = require('../lib/uploadImageToDrive');

module.exports = {
    key: 'imageUploadJob',
    async handle({ data }) {
        const { fileInfo, userData, hasImage } = data;
        await uploadImageToDrive({filesArray: fileInfo.files, folderName: fileInfo.folderName, userData });
    }
}