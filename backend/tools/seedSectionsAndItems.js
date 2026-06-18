/*
Seed script: creates 20 initial items for the app.
Run with: `npm run seed:items` from the backend folder.
Make sure .env MONGO_URI is set and `npm install` has been run.
*/

require('dotenv').config();
const connectDB = require('../config/db');
const Item = require('../models/Item');

const items = [
  {
    name: 'A4 Paper 500 Sheets',
    description: 'High-quality copier paper, 80gsm, 500 sheets per ream.',
    rate: 5.99,
    hsnCode: '4802',
    taxRate: 19,
    unit: 'Ream',
    category: 'Office Supplies'
  },
  {
    name: 'Ballpoint Pen Set 10',
    description: 'Smooth writing black ink pens, set of 10.',
    rate: 9.99,
    hsnCode: '9608',
    taxRate: 19,
    unit: 'Set',
    category: 'Office Supplies'
  },
  {
    name: 'Spiral Notebook A5',
    description: 'A5 spiral notebook with 120 lined pages.',
    rate: 4.50,
    hsnCode: '4820',
    taxRate: 19,
    unit: 'Piece',
    category: 'Office Supplies'
  },
  {
    name: 'Highlighter Set 6',
    description: 'Bright highlighters in 6 colors.',
    rate: 7.99,
    hsnCode: '9608',
    taxRate: 19,
    unit: 'Set',
    category: 'Office Supplies'
  },
  {
    name: 'Desk Organizer Tray',
    description: 'Desk tray organizer for documents and stationery.',
    rate: 14.99,
    hsnCode: '3926',
    taxRate: 19,
    unit: 'Piece',
    category: 'Office Supplies'
  },
  {
    name: 'USB-C Cable 2m',
    description: 'Durable USB-C charging and data cable, 2 meters.',
    rate: 10.50,
    hsnCode: '8544',
    taxRate: 19,
    unit: 'Piece',
    category: 'Electronics'
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver.',
    rate: 19.99,
    hsnCode: '8471',
    taxRate: 19,
    unit: 'Piece',
    category: 'Electronics'
  },
  {
    name: 'Laptop Stand',
    description: 'Foldable laptop stand for desk use.',
    rate: 29.99,
    hsnCode: '8473',
    taxRate: 19,
    unit: 'Piece',
    category: 'Electronics'
  },
  {
    name: 'External Hard Drive 1TB',
    description: 'Portable USB 3.0 hard drive, 1TB capacity.',
    rate: 69.99,
    hsnCode: '8471',
    taxRate: 19,
    unit: 'Piece',
    category: 'Electronics'
  },
  {
    name: 'Printer Ink Cartridge',
    description: 'Black ink cartridge for office printers.',
    rate: 24.50,
    hsnCode: '8443',
    taxRate: 19,
    unit: 'Piece',
    category: 'Office Supplies'
  },
  {
    name: 'Website Maintenance (monthly)',
    description: 'Monthly website maintenance and updates service.',
    rate: 199.00,
    hsnCode: '9983',
    taxRate: 19,
    unit: 'Month',
    category: 'Services'
  },
  {
    name: 'SEO Optimization (monthly)',
    description: 'Search engine optimization service for one month.',
    rate: 149.00,
    hsnCode: '9983',
    taxRate: 19,
    unit: 'Month',
    category: 'Services'
  },
  {
    name: 'Cloud Backup 1TB (12 months)',
    description: 'Secure cloud backup service for one year.',
    rate: 59.99,
    hsnCode: '9983',
    taxRate: 19,
    unit: 'Subscription',
    category: 'Software'
  },
  {
    name: 'Antivirus License 12 months',
    description: 'Comprehensive antivirus license for one computer.',
    rate: 39.99,
    hsnCode: '8523',
    taxRate: 19,
    unit: 'License',
    category: 'Software'
  },
  {
    name: 'Coffee Capsules 100pcs',
    description: 'Premium coffee capsules compatible with Nespresso.',
    rate: 18.99,
    hsnCode: '2101',
    taxRate: 19,
    unit: 'Pack',
    category: 'Pantry'
  },
  {
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with touch controls.',
    rate: 34.99,
    hsnCode: '9405',
    taxRate: 19,
    unit: 'Piece',
    category: 'Electronics'
  },
  {
    name: 'Ergonomic Mouse Pad',
    description: 'Comfort mouse pad with wrist support.',
    rate: 7.99,
    hsnCode: '4820',
    taxRate: 19,
    unit: 'Piece',
    category: 'Office Supplies'
  },
  {
    name: 'A3 Plotter Paper Roll',
    description: 'Roll of A3 plotter paper for large format printing.',
    rate: 45.00,
    hsnCode: '4802',
    taxRate: 19,
    unit: 'Roll',
    category: 'Office Supplies'
  },
  {
    name: 'Whiteboard Marker Set 12',
    description: 'Dry erase marker set in 12 colors.',
    rate: 9.50,
    hsnCode: '9608',
    taxRate: 19,
    unit: 'Set',
    category: 'Office Supplies'
  },
  {
    name: 'Label Printer Tape 12mm',
    description: '12mm label printer tape cartridge.',
    rate: 8.99,
    hsnCode: '4820',
    taxRate: 19,
    unit: 'Roll',
    category: 'Office Supplies'
  }
];

const seed = async () => {
  try {
    await connectDB();

    const existingItems = await Item.find({ name: { $in: items.map(item => item.name) } }).select('name');
    const existingNames = existingItems.map(item => item.name);
    const itemsToInsert = items.filter(item => !existingNames.includes(item.name));

    if (itemsToInsert.length === 0) {
      console.log('✅ All seed items already exist. No new items were added.');
      process.exit(0);
    }

    const created = await Item.insertMany(itemsToInsert);
    console.log(`✅ Added ${created.length} items.`);
    created.forEach(it => console.log(`- ${it.name} - €${it.rate.toFixed(2)} (${it.unit})`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
