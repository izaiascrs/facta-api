const { sendProposalStatusMessage } = require('../lib/sendProposalStatusMessage');

module.exports = {
    key: 'proposalStatusMessageJob',
    async handle({ data }) {
        await sendProposalStatusMessage(data);
    }
}