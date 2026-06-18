const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');
const Bill = require('../models/Bill');
const { generatePurchaseOrderPDF } = require('../services/pdfService');
const { sendPurchaseOrderEmail } = require('../services/mailService');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Seller/company env vars (for PDF)
const COMPANY_NAME = process.env.COMPANY_NAME;
const COMPANY_ADDRESS_LINE1 = process.env.COMPANY_ADDRESS_LINE1;
const COMPANY_ADDRESS_LINE2 = process.env.COMPANY_ADDRESS_LINE2;
const COMPANY_CITY_STATE_ZIP = process.env.COMPANY_CITY_STATE_ZIP;
const COMPANY_COUNTRY = process.env.COMPANY_COUNTRY;
const COMPANY_PHONE = process.env.COMPANY_PHONE;
const COMPANY_EMAIL = process.env.COMPANY_EMAIL;
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE;
const LOGO_PATH = process.env.LOGO_PATH;

const saveTempPDF = (buffer, poNumber) => {
  const filePath = path.join(os.tmpdir(), `po_${poNumber}.pdf`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

// CREATE PO
const createPurchaseOrder = async (req, res) => {
  try {
    const { vendorId, vendorName, deliveryAddress, referenceNo, date, deliveryDate, paymentTerms, shipmentPreference, items = [], taxRate = 0, status = 'DRAFT' } = req.body;

    // vendor validation (optional)
    let vendor = null;
    if (vendorId) vendor = await Vendor.findById(vendorId);

    if (!vendor && !vendorName) {
      return res.status(400).json({ success: false, error: 'Vendor name or vendorId required' });
    }

    if (!items || items.length === 0) return res.status(400).json({ success: false, error: 'Items required' });

    // calculate totals
    let subtotal = 0;
    const processedItems = items.map(it => {
      const qty = Number(it.quantity || 1);
      const rate = Number(it.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      return { name: it.name || it.description || '', description: it.description || '', quantity: qty, rate, discount: it.discount || 0, amount };
    });

    const tax = subtotal * (Number(taxRate) / 100);
    const total = subtotal + tax;

    // generate PO number
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    const po = new PurchaseOrder({
      poNumber,
      vendorName: vendor ? vendor.name : vendorName,
      vendorId: vendor ? vendor._id : null,
      deliveryAddress: deliveryAddress || (vendor?.billingAddress || ''),
      referenceNo: referenceNo || '',
      date: date ? new Date(date) : new Date(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      paymentTerms: paymentTerms || (vendor?.paymentTerms || 'Due on Receipt'),
      shipmentPreference: shipmentPreference || '',
      status: status || 'DRAFT',
      items: processedItems,
      subtotal,
      tax,
      total
    });

    await po.save();

    if (vendor && vendor.email) {
      try {
        const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
        const city = cityParts.join(' ');

        const pdfData = {
          poNumber,
          poDate: new Date(po.date).toLocaleDateString('en-US'),
          deliveryDate: po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-US') : '',
          seller: {
            name: COMPANY_NAME,
            street: [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2].filter(Boolean).join(', '),
            postalCode,
            city,
            country: COMPANY_COUNTRY,
            phone: COMPANY_PHONE,
            email: COMPANY_EMAIL,
            website: COMPANY_WEBSITE
          },
          vendor: {
            name: vendor.name || po.vendorName || '',
            street: vendor.billingAddress || po.deliveryAddress || '',
            postalCode: vendor.billingPin || '',
            city: vendor.billingCity || ''
          },
          items: po.items || [],
          subtotal: po.subtotal || 0,
          tax: po.tax || 0,
          total: po.total || 0,
          logoPath: LOGO_PATH
        };

        const pdfBuffer = await generatePurchaseOrderPDF(pdfData);
        const pdfPath = saveTempPDF(pdfBuffer, po.poNumber);

        await sendPurchaseOrderEmail(
          {
            poNumber: po.poNumber,
            total: po.total,
            date: po.date,
            deliveryDate: po.deliveryDate,
            status: po.status
          },
          vendor,
          pdfPath
        ).catch(err => console.error('Purchase order email error:', err));
      } catch (emailError) {
        console.error('Purchase order email failure:', emailError);
      }
    }

    res.status(201).json({ success: true, purchaseOrder: po });

  } catch (error) {
    console.error('Create PO error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET ALL
const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate('vendorId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, purchaseOrders: pos });
  } catch (error) {
    console.error('Get POs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ONE
const getPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (error) {
    console.error('Get PO error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE
const updatePurchaseOrder = async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date() };
    if (update.items) {
      // recalc totals if items provided
      let subtotal = 0;
      update.items = update.items.map(it => {
        const qty = Number(it.quantity || 1);
        const rate = Number(it.rate || 0);
        const amount = qty * rate;
        subtotal += amount;
        return { ...it, quantity: qty, rate, amount };
      });
      const taxRate = Number(req.body.taxRate || 0);
      update.subtotal = subtotal;
      update.tax = subtotal * (taxRate / 100);
      update.total = update.subtotal + update.tax;
    }

    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (error) {
    console.error('Update PO error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE
const deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Delete PO error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// CONVERT TO BILL
const convertToBill = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });

    // mark as billed
    po.status = 'BILLED';
    await po.save();

    // create a Bill record for bookkeeping
    const billCount = await Bill.countDocuments();
    const billNumber = `BILL-${String(billCount + 1).padStart(6, '0')}`;

    const bill = new Bill({
      billNumber,
      vendorId: po.vendorId,
      items: po.items.map(i => ({ name: i.name, description: i.description, quantity: i.quantity, rate: i.rate, amount: i.amount })),
      date: new Date(),
      subtotal: po.subtotal,
      tax: po.tax,
      total: po.total,
      status: 'UNPAID'
    });

    await bill.save();

    res.json({ success: true, purchaseOrder: po, bill });
  } catch (error) {
    console.error('Convert to bill error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DASHBOARD STATS
const getStats = async (req, res) => {
  try {
    const totalPOs = await PurchaseOrder.countDocuments();
    const draftPOs = await PurchaseOrder.countDocuments({ status: 'DRAFT' });
    const openPOs = await PurchaseOrder.countDocuments({ status: 'OPEN' });

    res.json({ success: true, stats: { totalPOs, draftPOs, openPOs } });
  } catch (error) {
    console.error('PO stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate PO PDF
const generatePOPdf = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId');
    if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });

    const vendor = po.vendorId || { name: po.vendorName || '', street: po.deliveryAddress || '' };

    const [postalCode, ...cityParts] = (COMPANY_CITY_STATE_ZIP || '').split(' ');
    const city = cityParts.join(' ');

    const pdfData = {
      poNumber: po.poNumber,
      poDate: new Date(po.date).toLocaleDateString('en-US'),
      deliveryDate: po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-US') : '',
      seller: {
        name: COMPANY_NAME,
        street: [COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2].filter(Boolean).join(', '),
        postalCode,
        city,
        country: COMPANY_COUNTRY,
        phone: COMPANY_PHONE,
        email: COMPANY_EMAIL,
        website: COMPANY_WEBSITE
      },
      vendor: {
        name: vendor.name || '',
        street: vendor.billingAddress || vendor.street || po.deliveryAddress || '',
        postalCode: vendor.billingPin || '',
        city: vendor.billingCity || ''
      },
      items: po.items || [],
      subtotal: po.subtotal || 0,
      tax: po.tax || 0,
      total: po.total || 0,
      logoPath: LOGO_PATH
    };

    const pdfBuffer = await generatePurchaseOrderPDF(pdfData);
    const pdfPath = saveTempPDF(pdfBuffer, po.poNumber);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${po.poNumber}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate PO PDF error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  convertToBill,
  getStats,
  generatePOPdf
};
