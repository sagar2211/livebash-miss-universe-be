const schedule = require("node-schedule");
let rule = new schedule.RecurrenceRule();
const { eventRemainder } = require("./event-remainder");
const { createDigitalCollectible } = require("./digital-collectible");

exports.scheduler = () => {
  try {
    rule.tz = "America/Chicago";
    schedule.scheduleJob('0 */15 * * * *', async function () {
      eventRemainder();
      // createDigitalCollectible();
    });
  } catch (error) {
    log.Error(`${error.toString()}`);
  }
};
