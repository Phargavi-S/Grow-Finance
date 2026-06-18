const Vendor = require('../models/Vendor');

// Create new vendor
const createVendor = async (req, res) => {
  try {
    const { name, email, phone, billingAddress, billingCity, billingState, billingPin, billingCountry, paymentTerms } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const vendor = new Vendor({
      name,
      email: email || '',
      phone: phone || '',
      billingAddress: billingAddress || '',
      billingCity: billingCity || '',
      billingState: billingState || '',
      billingPin: billingPin || '',
      billingCountry: billingCountry || '',
      paymentTerms: paymentTerms || 'Due on Receipt'
    });

    await vendor.save();
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    console.error('Vendor create error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all vendors
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json({ success: true, vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single vendor
const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createVendor,
  getVendors,
  getVendor,
  updateVendor,
  deleteVendor
};
