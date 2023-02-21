const {  uploadImageToApi } = require('../lib/uploadImageToApi');

module.exports = {
    key: 'uploadImageToApiJob',
    async handle({ data }) {
        await uploadImageToApi(data);
    }
}