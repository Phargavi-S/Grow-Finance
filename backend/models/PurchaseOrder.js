const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, unique: true },
  vendorName: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  deliveryAddress: { type: String, default: '' },
  referenceNo: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  deliveryDate: { type: Date },
  paymentTerms: { type: String, default: 'Due on Receipt' },
  shipmentPreference: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT','OPEN','RECEIVED','BILLED','PAID'], default: 'DRAFT' },
  items: [poItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
