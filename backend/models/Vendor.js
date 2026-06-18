const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  billingAddress: { type: String, default: '' },
  billingCity: { type: String, default: '' },
  billingState: { type: String, default: '' },
  billingPin: { type: String, default: '' },
  billingCountry: { type: String, default: '' },
  paymentTerms: { type: String, default: 'Due on Receipt' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
