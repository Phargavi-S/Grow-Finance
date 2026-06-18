const mongoose = require('mongoose');

const recurringItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  quantity: Number,
  rate: Number,
  amount: Number
});

const recurringSchema = new mongoose.Schema({
  name: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [recurringItemSchema],
  frequency: { type: String, enum: ['DAILY','WEEKLY','MONTHLY','YEARLY'], default: 'MONTHLY' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  dueDate: { type: Date },
  vatRate: { type: Number, default: 19 },
  closingText: { type: String },
  autoSendEmail: { type: Boolean, default: false },
  cycles: { type: Number },
  generatedCount: { type: Number, default: 0 },
  nextRun: { type: Date, index: true },
  status: { type: String, enum: ['ACTIVE','PAUSED','COMPLETED'], default: 'ACTIVE' },
  lastRun: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('RecurringInvoice', recurringSchema);
