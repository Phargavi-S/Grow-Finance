const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const { sendReminderEmail } = require('../services/mailService');

let reminderTask = null;

// Calculate if reminder should be sent based on frequency and last sent date
const shouldSendReminder = (reminderFrequency, lastReminderSent) => {
  if (reminderFrequency === 'None') {
    return false;
  }

  const now = new Date();
  let intervalDays = 0;

  switch (reminderFrequency) {
    case 'Weekly':
      intervalDays = 7;
      break;
    case 'Monthly':
      intervalDays = 30;
      break;
    case 'Yearly':
      intervalDays = 365;
      break;
    default:
      return false;
  }

  // If never sent, send immediately
  if (!lastReminderSent) {
    return true;
  }

  // Calculate days since last reminder
  const lastSentTime = new Date(lastReminderSent).getTime();
  const nowTime = now.getTime();
  const daysSinceLastSent = (nowTime - lastSentTime) / (1000 * 60 * 60 * 24);

  // Send if required interval has passed
  return daysSinceLastSent >= intervalDays;
};

const runInvoiceReminderJob = async () => {
  try {
    console.log('📧 Starting invoice reminder scheduler run...');

    const unpaidInvoices = await Invoice.find({
      status: 'UNPAID',
      reminderFrequency: { $ne: 'None' }
    }).populate('customerId', 'name email');

    console.log(`Found ${unpaidInvoices.length} UNPAID invoices with reminders enabled`);

    let remindersSent = 0;
    let remindersFailed = 0;
    let remindersSkipped = 0;

    for (const invoice of unpaidInvoices) {
      try {
        if (!shouldSendReminder(invoice.reminderFrequency, invoice.lastReminderSent)) {
          remindersSkipped++;
          continue;
        }

        const customer = invoice.customerId;

        if (!customer || !customer.email) {
          remindersSkipped++;
          console.warn(`⚠️ Skipping reminder for invoice ${invoice.invoiceNumber}: customer email missing`);
          continue;
        }

        const emailResult = await sendReminderEmail(
          {
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total,
            date: invoice.date,
            dueDate: invoice.dueDate
          },
          customer
        );

        if (emailResult?.skipped) {
          remindersSkipped++;
          console.warn(`⚠️ Reminder skipped for invoice ${invoice.invoiceNumber}: email disabled`);
          continue;
        }

        invoice.lastReminderSent = new Date();
        await invoice.save();

        remindersSent++;
        console.log(`✅ Reminder sent for invoice ${invoice.invoiceNumber}`);
      } catch (err) {
        remindersFailed++;
        console.error(
          `❌ Error processing reminder for invoice ${invoice.invoiceNumber}:`,
          err.emailErrorType || 'scheduler',
          err.message
        );
      }
    }

    console.log(`📧 Invoice reminder scheduler completed. sent=${remindersSent} failed=${remindersFailed} skipped=${remindersSkipped}`);
  } catch (error) {
    console.error('❌ Invoice reminder scheduler error:', error.message);
  }
};

const startInvoiceReminderScheduler = () => {
  if (reminderTask) {
    console.log('ℹ️ Invoice reminder scheduler already initialized — skipping duplicate start');
    return reminderTask;
  }

  const scheduleOptions = { scheduled: true };
  if (process.env.CRON_TIMEZONE) {
    scheduleOptions.timezone = process.env.CRON_TIMEZONE;
  }

  reminderTask = cron.schedule('0 9 * * *', runInvoiceReminderJob, scheduleOptions);

  console.log('✅ Invoice reminder scheduler started (runs daily at 9 AM' + (process.env.CRON_TIMEZONE ? `, timezone ${process.env.CRON_TIMEZONE}` : '') + ')');
  return reminderTask;
};

module.exports = { startInvoiceReminderScheduler, runInvoiceReminderJob };
