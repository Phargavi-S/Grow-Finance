const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  rate: { type: Number, required: true },
  hsnCode: { type: String, default: '' },
  taxRate: { type: Number, default: 18 },
  unit: { type: String, default: 'Nos' },
  category: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);