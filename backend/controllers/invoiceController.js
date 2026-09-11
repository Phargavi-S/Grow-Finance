const fs = require('fs');
const path = require('path');
const os = require('os');

const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

const { generateInvoicePDF, buildInvoiceHtml } = require('../services/pdfService');
const { sendInvoiceEmail, sendReminderEmail } = require('../services/mailService');

// ===== ENV VARIABLES =====
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

// Deployment-safe logo path: bundled backend asset with env fallback
const LOGO_PATH = (() => {
  const bundledPath = path.join(__dirname, '../assets/ArshanUG.jpeg');
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }
  if (process.env.LOGO_PATH && fs.existsSync(process.env.LOGO_PATH)) {
    return process.env.LOGO_PATH;
  }
  console.warn('⚠️ Logo file not found at bundled path or LOGO_PATH env. Invoice PDF will be generated without logo.');
  return null;
})();

// ===== HELPER =====
const saveTempPDF = (buffer, invoiceNumber) => {
    const filePath = path.join(os.tmpdir(), `invoice_${invoiceNumber}.pdf`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
};

const buildSellerBlock = () => {
    const fullStreet = [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2]
        .filter(Boolean)
        .join(', ');
    const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
    const city = cityParts.join(' ');
    return {
        fullStreet,
        postalCode,
        city,
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
        }
    };
};

const buildCustomerBlock = (customer) => ({
    name: customer.name || '',
    street: customer.billingAddress || '',
    postalCode: customer.billingPin || '',
    city: customer.billingCity || '',
    state: customer.billingState || '',
    country: customer.billingCountry || ''
});

const buildInvoicePdfData = (invoiceNumber, invoice, customer, items, vatRate, closingText) => {
    const { seller } = buildSellerBlock();
    return {
        invoiceNumber,
        invoiceDate: new Date(invoice.date || Date.now()).toLocaleDateString('en-US'),
        dueDate: new Date(invoice.dueDate || Date.now()).toLocaleDateString('en-US'),
        serviceDate: new Date().toLocaleDateString('en-US'),
        customerNumber: customer.customerNumber || '1001',
        seller,
        customer: buildCustomerBlock(customer),
        items: items || [],
        vatRate,
        logoPath: LOGO_PATH,
        closingText: closingText || ''
    };
};

const generateNextOrderNumber = async () => {
    const lastInvoice = await Invoice.findOne({
        orderNumber: { $exists: true, $nin: [null, ''] }
    }).sort({ orderNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.orderNumber) {
        const num = parseInt(String(lastInvoice.orderNumber).replace(/^ORD-/, ''), 10);
        if (!Number.isNaN(num)) {
            nextNumber = num + 1;
        }
    }

    return `ORD-${String(nextNumber).padStart(6, '0')}`;
};

// ===== CREATE INVOICE =====
const createInvoice = async (req, res) => {
    try {
        const {
            customerId,
            items = [],
            dueDate,
            vatRate = 19,
            closingText = '',
            status,
            sendEmail = false
        } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Items required' });
        }

        // Normalize incoming items (frontend already sends calculated amounts)
        const processedItems = items.map(item => {
            return {
                name: item.name || item.description || '',
                description: item.description || item.name || '',
                quantity: parseFloat(item.quantity || 1),
                rate: parseFloat(item.rate || item.unitPrice || 0),
                discount: parseFloat(item.discount || 0),
                amount: parseFloat(item.amount || 0)
            };
        });

        const subtotal = (req.body.subTotal !== undefined)
            ? parseFloat(req.body.subTotal)
            : processedItems.reduce((s, it) => s + (it.amount || (it.quantity * it.rate)), 0);

        const tax = (req.body.totalAmount !== undefined)
            ? parseFloat((req.body.totalAmount - subtotal).toFixed(2))
            : parseFloat((subtotal * (vatRate / 100)).toFixed(2));

        const total = (req.body.totalAmount !== undefined)
            ? parseFloat(req.body.totalAmount)
            : parseFloat((subtotal + tax).toFixed(2));

        const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
        let nextNumber = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const num = parseInt(
                lastInvoice.invoiceNumber.replace("RE-", "")
            );
            nextNumber = num + 1;
        }

const invoiceNumber =
    `RE-${String(nextNumber).padStart(6, '0')}`;

        const orderNumber = await generateNextOrderNumber();

        const invoice = new Invoice({
            invoiceNumber,
            orderNumber,
            customerId,
            items: processedItems,
            date: req.body.invoiceDate ? new Date(req.body.invoiceDate) : new Date(),
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : (dueDate || new Date(Date.now() + 14 * 86400000)),
            subtotal,
            tax,
            total,
            status: (status === 'PAID') ? 'PAID' : 'UNPAID',
            terms: req.body.terms || 'Due on Receipt',
            notes: req.body.notes || '',
            reminderFrequency: req.body.reminderFrequency || 'None'
        });

        await invoice.save();

        let emailSent = false;
        let emailError = null;

        // If requested, generate PDF and send email
        if (sendEmail) {
            try {
                if (!customer.email) {
                    throw Object.assign(new Error('Customer email not available'), { emailErrorType: 'invalid_recipient' });
                }

                const pdfData = buildInvoicePdfData(
                    invoiceNumber,
                    invoice,
                    customer,
                    processedItems,
                    vatRate,
                    closingText || ''
                );

                const pdfBuffer = await generateInvoicePDF(pdfData);
                const pdfPath = saveTempPDF(pdfBuffer, invoiceNumber);

                const emailResult = await sendInvoiceEmail(
                    {
                        invoiceNumber,
                        total,
                        date: invoice.date,
                        dueDate: invoice.dueDate,
                        status: invoice.status
                    },
                    customer,
                    pdfPath
                );
                emailSent = !emailResult?.skipped;
                if (emailResult?.skipped) {
                    emailError = 'Email sending is disabled (EMAIL_ENABLED=false)';
                }
            } catch (emailErr) {
                emailError = emailErr.message;
                console.error('Email sending error on create:', emailErr.emailErrorType || 'unknown', emailErr.message);
            }
        }

        // Return the created invoice as JSON (frontend expects JSON)
        res.json({ success: true, invoice, emailSent, emailError });

    } catch (error) {
        console.error('❌ Invoice Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== GET ALL INVOICES =====
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, invoices });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== GET SINGLE INVOICE =====
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customerId');

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({ success: true, invoice });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== UPDATE INVOICE =====
const updateInvoice = async (req, res) => {
    try {
        // Allow client to request resending email via { sendEmail: true }
        const { sendEmail } = req.body;
        // Create an update object without sendEmail so it doesn't get persisted
        const updateFields = { ...req.body };
        delete updateFields.sendEmail;

        const updated = await Invoice.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        let emailSent = false;
        let emailError = null;

        // If requested, generate PDF and send email for the updated invoice
        if (sendEmail) {
            try {
                const customer = await Customer.findById(updated.customerId);
                if (!customer || !customer.email) {
                    throw Object.assign(new Error('Customer email not available'), { emailErrorType: 'invalid_recipient' });
                }

                const pdfData = buildInvoicePdfData(
                    updated.invoiceNumber,
                    updated,
                    customer,
                    updated.items || [],
                    req.body.vatRate || 19,
                    updated.closingText || ''
                );

                const pdfBuffer = await generateInvoicePDF(pdfData);
                const pdfPath = saveTempPDF(pdfBuffer, updated.invoiceNumber || updated._id);

                const emailResult = await sendInvoiceEmail(
                    {
                        invoiceNumber: updated.invoiceNumber,
                        total: updated.total,
                        date: updated.date,
                        dueDate: updated.dueDate,
                        status: updated.status
                    },
                    customer,
                    pdfPath
                );
                emailSent = !emailResult?.skipped;
                if (emailResult?.skipped) {
                    emailError = 'Email sending is disabled (EMAIL_ENABLED=false)';
                }
            } catch (emailErr) {
                emailError = emailErr.message;
                console.error('Email sending error on update:', emailErr.emailErrorType || 'unknown', emailErr.message);
            }
        }

        res.json({ success: true, invoice: updated, emailSent, emailError });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== DELETE INVOICE =====
const deleteInvoice = async (req, res) => {
    try {
        const deleted = await Invoice.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({ success: true, message: 'Invoice deleted' });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== SEND REMINDER =====
const sendInvoiceReminder = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId');

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const customer = invoice.customerId;

        if (!customer || !customer.email) {
            return res.status(400).json({ error: 'Customer email not found' });
        }

        const emailResult = await sendReminderEmail(
            {
                invoiceNumber: invoice.invoiceNumber,
                total: invoice.total,
                dueDate: invoice.dueDate
            },
            customer
        );

        if (emailResult?.skipped) {
            return res.status(503).json({ success: false, error: 'Email sending is disabled (EMAIL_ENABLED=false)' });
        }

        invoice.lastReminderSent = new Date();
        await invoice.save();

        res.json({ success: true, message: 'Reminder sent successfully' });

    } catch (error) {
        console.error('Send reminder error:', error.emailErrorType || 'unknown', error.message);
        res.status(500).json({ error: error.message, emailErrorType: error.emailErrorType || 'unknown' });
    }
};

const getInvoicePreviewHtml = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId');

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        const customer = invoice.customerId || {};

        const pdfData = buildInvoicePdfData(
            invoice.invoiceNumber,
            invoice,
            customer,
            invoice.items || [],
            19,
            invoice.closingText || ''
        );

        const html = buildInvoiceHtml(pdfData);
        res.json({ success: true, html });
    } catch (error) {
        console.error('Invoice preview error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== UPDATE STATUS =====
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['PAID', 'UNPAID'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Status must be PAID or UNPAID' });
        }

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!invoice) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({ success: true, invoice });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== DASHBOARD STATS =====
const getDashboardStats = async (req, res) => {
    try {
        const totalInvoices = await Invoice.countDocuments();
        const paidInvoices = await Invoice.countDocuments({ status: 'PAID' });
        const unpaidInvoices = totalInvoices - paidInvoices;

        const revenue = await Invoice.aggregate([
            { $match: { status: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalPOs = await PurchaseOrder.countDocuments();
        const draftPOs = await PurchaseOrder.countDocuments({ status: 'DRAFT' });
        const openPOs = await PurchaseOrder.countDocuments({ status: 'OPEN' });

        res.json({
            success: true,
            stats: {
                totalInvoices,
                paidInvoices,
                unpaidInvoices,
                totalRevenue: revenue[0]?.total || 0,
                totalPOs,
                draftPOs,
                openPOs
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ===== EXPORT =====
module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    getDashboardStats,
    sendInvoiceReminder,
    getInvoicePreviewHtml
};