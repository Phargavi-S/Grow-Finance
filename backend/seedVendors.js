const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

const vendors = [
  {
    name: 'Nordic Supplies GmbH',
    email: 'vendor1@example.com',
    phone: '+49 30 1234567',
    billingAddress: 'Friedrichstrasse 10',
    billingCity: 'Berlin',
    billingState: 'Berlin',
    billingPin: '10117',
    billingCountry: 'Germany',
    paymentTerms: 'Net 30',
    notes: 'Preferred packaging supplier'
  },
  {
    name: 'Harbor Tech Solutions',
    email: 'vendor2@example.com',
    phone: '+1 415 555 0199',
    billingAddress: '120 Market St',
    billingCity: 'San Francisco',
    billingState: 'CA',
    billingPin: '94103',
    billingCountry: 'USA',
    paymentTerms: 'Due on Receipt',
    notes: 'IT services and maintenance'
  },
  {
    name: 'Maple Office Supplies',
    email: 'vendor3@example.com',
    phone: '+1 416 555 0123',
    billingAddress: '88 King St W',
    billingCity: 'Toronto',
    billingState: 'ON',
    billingPin: 'M5H 1A1',
    billingCountry: 'Canada',
    paymentTerms: 'Net 15',
    notes: 'Stationery and office equipment'
  },
  {
    name: 'Bluewave Logistics',
    email: 'vendor4@example.com',
    phone: '+44 20 7946 0991',
    billingAddress: '12 Dockside Rd',
    billingCity: 'London',
    billingState: '',
    billingPin: 'E14 2BB',
    billingCountry: 'UK',
    paymentTerms: 'Net 30',
    notes: 'Freight and shipping partner'
  },
  {
    name: 'Greenfield Foods',
    email: 'vendor5@example.com',
    phone: '+61 2 9374 4000',
    billingAddress: '45 Harvest Lane',
    billingCity: 'Sydney',
    billingState: 'NSW',
    billingPin: '2000',
    billingCountry: 'Australia',
    paymentTerms: 'Net 14',
    notes: 'Cafeteria and pantry supplies'
  },
  {
    name: 'Precision Hardware Co',
    email: 'vendor6@example.com',
    phone: '+49 89 7654321',
    billingAddress: 'Werkstrasse 4',
    billingCity: 'Munich',
    billingState: 'Bavaria',
    billingPin: '80331',
    billingCountry: 'Germany',
    paymentTerms: 'Net 30',
    notes: ''
  },
  {
    name: 'Latitude Creative',
    email: 'vendor7@example.com',
    phone: '+34 91 123 4567',
    billingAddress: 'Calle Mayor 20',
    billingCity: 'Madrid',
    billingState: '',
    billingPin: '28013',
    billingCountry: 'Spain',
    paymentTerms: 'Due on Receipt',
    notes: 'Design and printing services'
  },
  {
    name: 'Summit Electricals',
    email: 'vendor8@example.com',
    phone: '+91 80 1234 5678',
    billingAddress: '10 Tech Park',
    billingCity: 'Bangalore',
    billingState: 'KA',
    billingPin: '560001',
    billingCountry: 'India',
    paymentTerms: 'Net 45',
    notes: 'Hardware and spare parts'
  },
  {
    name: 'Cedar Office Interiors',
    email: 'vendor9@example.com',
    phone: '+1 212 555 0147',
    billingAddress: '300 Madison Ave',
    billingCity: 'New York',
    billingState: 'NY',
    billingPin: '10017',
    billingCountry: 'USA',
    paymentTerms: 'Net 30',
    notes: 'Furniture and interior supplies'
  },
  {
    name: 'Aurora Marketing Ltd',
    email: 'vendor10@example.com',
    phone: '+44 161 555 0102',
    billingAddress: '7 Media Row',
    billingCity: 'Manchester',
    billingState: '',
    billingPin: 'M1 2AA',
    billingCountry: 'UK',
    paymentTerms: 'Net 14',
    notes: 'Marketing and PR services'
  }
];

async function seedVendors() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/billingDB');
    console.log('✅ Connected to MongoDB');

    // Optional: clear existing vendors
    // await Vendor.deleteMany({});
    // console.log('🗑️  Cleared existing vendors');

    const created = await Vendor.insertMany(vendors);
    console.log(`✅ Successfully added ${created.length} vendors!`);

    console.log('\n📋 Vendors Added:');
    created.forEach((v, i) => {
      console.log(`${i + 1}. ${v.name} - ${v.email} - ${v.phone}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding vendors:', error.message);
    process.exit(1);
  }
}

seedVendors();
