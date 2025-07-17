const { sendSimpleMessage } = require("../functions/digisac");

async function scheduleMessage(data = {}) {
  await sendSimpleMessage({ ...data });
}

module.exports = { scheduleMessage };