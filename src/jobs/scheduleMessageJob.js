const { scheduleMessage } = require("../lib/scheduleMessage");

module.exports = {
  key: "scheduleMessageJob",
  async handle({ data }) {
    await scheduleMessage(data);
  },
};
