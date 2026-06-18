/**
 * Quick test script to create a customer + invoice without going through HTTP/auth.
 * Usage: from the backend folder run
 *   EMAIL_ENABLED=false node tools/quickCreateInvoice.js
 * or
 *   node tools/quickCreateInvoice.js
 */

require('dotenv').config();
const connectDB = require('../config/db');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail } = require('../services/mailService');

const run = async () => {
  try {
    await connectDB();

    // find or create a test customer
    let customer = await Customer.findOne({ email: 'test.customer@example.com' });
    if (!customer) {
      customer = await Customer.create({ name: 'Quick Test Customer', email: 'test.customer@example.com', address: '123 Test Ave' });
      console.log('Created customer:', customer._id.toString());
    } else {
      console.log('Using existing customer:', customer._id.toString());
    }

    // pick or create an item
    let item = await Item.findOne();
    if (!item) {
      item = await Item.create({ name: 'Quick Item', rate: 250, taxRate: 18 });
      console.log('Created item:', item._id.toString());
    } else {
      console.log('Using item:', item._id.toString(), item.name);
    }

    // create invoice
    const invoice = new Invoice({
      customerId: customer._id,
      items: [
        {
          name: item.name,
          quantity: 1,
          rate: item.rate,
          taxRate: item.taxRate,
          amount: parseFloat((item.rate + (item.rate * (item.taxRate || 0) / 100)).toFixed(2))
        }
      ],
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      status: 'PENDING'
    });

    await invoice.save();
    const populated = await Invoice.findById(invoice._id).populate('customerId').populate('items.itemId');
    console.log('Created invoice:', populated.invoiceNumber, populated._id.toString());

    // send email and/or generate PDF depending on EMAIL_ENABLED
    const emailEnabled = (process.env.EMAIL_ENABLED || 'true').toString().toLowerCase() !== 'false';
    if (emailEnabled) {
      // generate PDF
      const pdfPath = await generateInvoicePDF(populated, populated.customerId);
      console.log('PDF generated at:', pdfPath);

      try {
        await sendInvoiceEmail(populated, populated.customerId, pdfPath);
        console.log('Email send attempted.');
      } catch (err) {
        console.error('Email send failed:', err.message || err);
      }
    } else {
      console.log('EMAIL_DISABLED - skipped PDF generation and email.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Quick invoice script failed:', err);
    process.exit(1);
  }
};

run();
