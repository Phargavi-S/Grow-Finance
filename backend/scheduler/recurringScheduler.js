const cron = require('node-cron');
const { processDuePlans } = require('../services/recurringService');

const startScheduler = () => {
  // run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await processDuePlans();
    } catch (err) {
      console.error('Recurring scheduler error:', err.message);
    }
  }, { scheduled: true });
  console.log('Recurring invoice scheduler started (daily at 00:00)');
};

module.exports = { startScheduler };
