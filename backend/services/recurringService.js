const fs = require('fs');
const path = require('path');
const os = require('os');
const RecurringInvoice = require('../models/RecurringInvoice');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { generateInvoicePDF } = require('./pdfService');
const { sendInvoiceEmail } = require('./mailService');

const COMPANY_NAME = process.env.COMPANY_NAME;
const COMPANY_ADDRESS_LINE1 = process.env.COMPANY_ADDRESS_LINE1;
const COMPANY_ADDRESS_LINE2 = process.env.COMPANY_ADDRESS_LINE2;
const COMPANY_CITY_STATE_ZIP = process.env.COMPANY_CITY_STATE_ZIP;
const COMPANY_COUNTRY = process.env.COMPANY_COUNTRY;
const COMPANY_PHONE = process.env.COMPANY_PHONE;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL;
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE;
const COMPANY_VAT_ID = process.env.COMPANY_VAT_ID;
const COMPANY_TAX_NUMBER = process.env.COMPANY_TAX_NUMBER;
const COMPANY_OWNER = process.env.COMPANY_OWNER;
const COMPANY_BANK = process.env.COMPANY_BANK;
const COMPANY_IBAN = process.env.COMPANY_IBAN;
const COMPANY_BIC = process.env.COMPANY_BIC;
const LOGO_PATH = process.env.LOGO_PATH;

const saveTempPDF = (buffer, invoiceNumber) => {
  const filePath = path.join(os.tmpdir(), `invoice_${invoiceNumber}.pdf`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const addInterval = (date, frequency) => {
  const d = new Date(date);
  switch ((frequency || '').toUpperCase()) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
};

const processPlan = async (planOrId) => {
  const plan = typeof planOrId === 'string' ? await RecurringInvoice.findById(planOrId) : planOrId;
  if (!plan) throw new Error('Recurring plan not found');
  if (plan.status !== 'ACTIVE') return null;

  const customer = await Customer.findById(plan.customerId);
  if (!customer) throw new Error('Customer not found for recurring plan');

  // Build DB items and compute totals
  let net = 0;
  const dbItems = (plan.items || []).map(it => {
    const quantity = parseFloat(it.quantity || 1);
    const rate = parseFloat(it.rate || it.unitPrice || 0);
    const amount = it.amount !== undefined ? parseFloat(it.amount) : parseFloat((quantity * rate).toFixed(2));
    net += quantity * rate;
    return {
      name: it.name || it.description || '',
      description: it.description || it.name || '',
      quantity,
      rate,
      amount
    };
  });

  const vatRate = plan.vatRate !== undefined ? parseFloat(plan.vatRate) : 19;
  const vatAmount = parseFloat((net * (vatRate / 100)).toFixed(2));
  const grossTotal = parseFloat((net + vatAmount).toFixed(2));

  const count = await Invoice.countDocuments();
  const invoiceNumber = `RE-${String(count + 1).padStart(6, '0')}`;

  const invoice = new Invoice({
    invoiceNumber,
    customerId: plan.customerId,
    items: dbItems,
    date: new Date(),
    dueDate: plan.dueDate || new Date(Date.now() + 14 * 86400000),
    subtotal: net,
    tax: vatAmount,
    total: grossTotal,
    status: 'UNPAID',
    recurringId: plan._id
  });

  await invoice.save();

  // Build PDF data
  const fullStreet = [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2].filter(Boolean).join(', ');
  const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
  const city = cityParts.join(' ');

  const pdfData = {
    invoiceNumber,
    invoiceDate: new Date().toLocaleDateString('en-US'),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('en-US'),
    serviceDate: new Date().toLocaleDateString('en-US'),
    customerNumber: customer.customerNumber || '1001',

    seller: {
      name: COMPANY_NAME,
      street: fullStreet,
      postalCode,
      city,
      country: COMPANY_COUNTRY,
      phone: COMPANY_PHONE,
      email: COMPANY_EMAIL,
      website: COMPANY_WEBSITE,
      vatId: COMPANY_VAT_ID,
      taxNumber: COMPANY_TAX_NUMBER,
      owner: COMPANY_OWNER,
      bank: COMPANY_BANK,
      iban: COMPANY_IBAN,
      bic: COMPANY_BIC
    },

    customer: {
      name: customer.name || '',
      street: customer.billingAddress || '',
      postalCode: customer.billingPin || '',
      city: customer.billingCity || '',
      state: customer.billingState || '',
      country: customer.billingCountry || ''
    },

    items: (dbItems || []).map(it => ({ description: it.description, quantity: it.quantity, unitPrice: it.rate })),
    vatRate,
    logoPath: LOGO_PATH,
    closingText: plan.closingText || ''
  };

  try {
    const pdfBuffer = await generateInvoicePDF(pdfData);
    const pdfPath = saveTempPDF(pdfBuffer, invoiceNumber);

    if (plan.autoSendEmail && customer && customer.email) {
      await sendInvoiceEmail(
        {
          invoiceNumber,
          total: grossTotal,
          date: invoice.date,
          dueDate: invoice.dueDate
        },
        customer,
        pdfPath
      ).catch(err => console.error('Recurring send email error:', err));
    } else if (!plan.autoSendEmail) {
      console.log(`Auto-send disabled for recurring plan ${plan._id}, skipping email.`);
    }
  } catch (err) {
    console.error('Error generating/sending PDF for recurring invoice:', err.message);
  }

  // Update plan counters
  plan.lastRun = new Date();
  plan.generatedCount = (plan.generatedCount || 0) + 1;

  // Compute next run or complete
  if (plan.cycles && plan.generatedCount >= plan.cycles) {
    plan.status = 'COMPLETED';
    plan.nextRun = null;
  } else {
    const base = plan.nextRun || plan.startDate || new Date();
    plan.nextRun = addInterval(base, plan.frequency);
  }

  await plan.save();

  return invoice;
};

const processDuePlans = async () => {
  const now = new Date();
  const duePlans = await RecurringInvoice.find({ status: 'ACTIVE', nextRun: { $lte: now } });
  for (const plan of duePlans) {
    try {
      // Prevent duplicate generation if plan was already run today
      if (plan.lastRun) {
        const last = new Date(plan.lastRun);
        const nowDate = new Date();
        if (last.toDateString() === nowDate.toDateString()) {
          console.log(`Skipping recurring plan ${plan._id} - already run today`);
          continue;
        }
      }

      await processPlan(plan);
    } catch (err) {
      console.error('Error processing recurring plan', plan._id, err.message);
    }
  }
};

module.exports = { processPlan, processDuePlans };
