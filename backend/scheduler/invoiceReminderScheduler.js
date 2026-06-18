const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const { sendReminderEmail } = require('../services/mailService');

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

// Start the scheduler
const startInvoiceReminderScheduler = () => {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('📧 Starting daily invoice reminder scheduler...');

      // Find all UNPAID invoices with reminder frequency
      const unpaidInvoices = await Invoice.find({
        status: 'UNPAID',
        reminderFrequency: { $ne: 'None' }
      }).populate('customerId', 'name email');

      console.log(`Found ${unpaidInvoices.length} UNPAID invoices with reminders enabled`);

      let remindersSent = 0;

      for (const invoice of unpaidInvoices) {
        try {
          // Check if reminder should be sent
          if (shouldSendReminder(invoice.reminderFrequency, invoice.lastReminderSent)) {
            const customer = invoice.customerId;

            // Only send if customer has email
            if (customer && customer.email) {
              await sendReminderEmail(
                {
                  invoiceNumber: invoice.invoiceNumber,
                  total: invoice.total,
                  date: invoice.date,
                  dueDate: invoice.dueDate
                },
                customer
              );

              // Update lastReminderSent timestamp
              invoice.lastReminderSent = new Date();
              await invoice.save();

              remindersSent++;
              console.log(`✅ Reminder sent for invoice ${invoice.invoiceNumber}`);
            }
          }
        } catch (err) {
          console.error(`❌ Error processing invoice ${invoice.invoiceNumber}:`, err.message);
        }
      }

      console.log(`📧 Invoice reminder scheduler completed. ${remindersSent} reminders sent.`);
    } catch (error) {
      console.error('❌ Invoice reminder scheduler error:', error);
    }
  });

  console.log('✅ Invoice reminder scheduler started (runs daily at 9 AM)');
};

module.exports = { startInvoiceReminderScheduler };
