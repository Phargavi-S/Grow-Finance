const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  workPhone: { type: String, default: '' },
  mobile: { type: String, default: '' },
  billingAddress: { type: String, default: '' },
  billingCity: { type: String, default: '' },
  billingState: { type: String, default: '' },
  billingPin: { type: String, default: '' },
  billingCountry: { type: String, default: 'India' },
  gstTreatment: { type: String, default: 'Registered' },
  placeOfSupply: { type: String, default: '' },
  pan: { type: String, default: '' },
  taxPreference: { type: String, default: 'Taxable' },
  paymentTerms: { type: String, default: 'Due on Receipt' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);