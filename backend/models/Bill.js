const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  quantity: Number,
  rate: Number,
  amount: Number
});

const billSchema = new mongoose.Schema({
  billNumber: { type: String, unique: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [billItemSchema],
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  subtotal: Number,
  tax: Number,
  total: Number,
  status: { type: String, enum: ['PAID','UNPAID'], default: 'UNPAID' }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
