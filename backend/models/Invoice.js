const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  quantity: Number,
  rate: Number,
  discount: Number,
  amount: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  orderNumber: { type: String, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [invoiceItemSchema],
  date: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  subtotal: Number,
  tax: Number,
  total: Number,
  recurringId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringInvoice' },
  status: { type: String, enum: ['PAID', 'UNPAID'], default: 'UNPAID' },
  terms: { type: String, default: 'Due on Receipt' },
  notes: { type: String, default: '' },
  reminderFrequency: { type: String, enum: ['None', 'Weekly', 'Monthly', 'Yearly'], default: 'None' },
  lastReminderSent: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);