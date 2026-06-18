const fs = require('fs');
const path = require('path');
const os = require('os');

const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');

const { generateInvoicePDF } = require('../services/pdfService');
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
const LOGO_PATH = process.env.LOGO_PATH;

// ===== HELPER =====
const saveTempPDF = (buffer, invoiceNumber) => {
    const filePath = path.join(os.tmpdir(), `invoice_${invoiceNumber}.pdf`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
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

        const invoice = new Invoice({
            invoiceNumber,
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

        // If requested, generate PDF and send email
        if (sendEmail && customer.email) {
            try {
                const fullStreet = [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2]
                    .filter(Boolean)
                    .join(', ');

                const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
                const city = cityParts.join(' ');

                const pdfData = {
                    invoiceNumber,
                    invoiceDate: new Date(invoice.date).toLocaleDateString('en-US'),
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
                    items: processedItems,
                    vatRate,
                    logoPath: LOGO_PATH,
                    closingText: closingText || ''
                };

                const pdfBuffer = await generateInvoicePDF(pdfData);
                const pdfPath = saveTempPDF(pdfBuffer, invoiceNumber);

                await sendInvoiceEmail(
                    {
                        invoiceNumber,
                        total,
                        date: invoice.date,
                        dueDate: invoice.dueDate
                    },
                    customer,
                    pdfPath
                );
            } catch (emailErr) {
                console.error('Email sending error on create:', emailErr);
            }
        }

        // Return the created invoice as JSON (frontend expects JSON)
        res.json({ success: true, invoice });

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

        // If requested, generate PDF and send email for the updated invoice
        if (sendEmail) {
            try {
                const customer = await Customer.findById(updated.customerId);
                if (customer && customer.email) {
                    const fullStreet = [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2]
                        .filter(Boolean)
                        .join(', ');

                    const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
                    const city = cityParts.join(' ');

                    const pdfData = {
                        invoiceNumber: updated.invoiceNumber,
                        invoiceDate: new Date(updated.date).toLocaleDateString('en-US'),
                        dueDate: new Date(updated.dueDate).toLocaleDateString('en-US'),
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
                        items: updated.items || [],
                        vatRate: req.body.vatRate || 19,
                        logoPath: LOGO_PATH,
                        closingText: updated.closingText || ''
                    };

                    const pdfBuffer = await generateInvoicePDF(pdfData);
                    const pdfPath = saveTempPDF(pdfBuffer, updated.invoiceNumber || updated._id);

                    await sendInvoiceEmail(
                        {
                            invoiceNumber: updated.invoiceNumber,
                            total: updated.total,
                            date: updated.date,
                            dueDate: updated.dueDate
                        },
                        customer,
                        pdfPath
                    );
                }
            } catch (emailErr) {
                console.error('Email sending error on update:', emailErr);
            }
        }

        res.json({ success: true, invoice: updated });

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

        await sendReminderEmail(
            {
                invoiceNumber: invoice.invoiceNumber,
                total: invoice.total,
                dueDate: invoice.dueDate
            },
            customer
        );

        invoice.lastReminderSent = new Date();
        await invoice.save();

        res.json({ success: true, message: 'Reminder sent successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ===== UPDATE STATUS =====
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
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
    sendInvoiceReminder
};