const { updateUser } = require('../lib/updateUser');

module.exports = {
    key: 'updateUserJob',
    async handle({ data }) {
        await updateUser(data);
    }
}