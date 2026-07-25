const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company: {
    logo: { type: String, default: '' },
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    taxVatNumber: { type: String, default: '', trim: true },
    registrationNumber: { type: String, default: '', trim: true },
    businessAddress: { type: String, default: '', trim: true }
  },
  bank: {
    bankName: { type: String, default: '', trim: true },
    accountHolderName: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    iban: { type: String, default: '', trim: true },
    swiftBic: { type: String, default: '', trim: true },
    branchName: { type: String, default: '', trim: true },
    currency: { type: String, default: 'EUR', trim: true }
  },
  invoicePreferences: {
    defaultCurrency: { type: String, default: 'EUR', trim: true },
    paymentTerms: { type: String, default: 'Due on Receipt', trim: true },
    invoicePrefix: { type: String, default: 'INV', trim: true },
    invoiceNotes: { type: String, default: '', trim: true },
    companySignature: { type: String, default: '' }
  },
  userProfile: {
    profilePhoto: { type: String, default: '' }
  },
  branding: {
    companyLogo: { type: String, default: '' },
    themeColor: { type: String, default: '#b2ff59', trim: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
