const mongoose = require('mongoose');
const Item = require('./models/Item');

const items = [
  // Office & Stationery Items
  {
    name: 'A4 Papier 500 Blatt',
    description: 'Hochwertiges Kopierpapier A4, 80g/m²',
    rate: 5.99,
    unit: 'Packung',
    category: 'Büromaterial',
    taxRate: 19
  },
  {
    name: 'Kugelschreiber (Box à 50)',
    description: 'Schwarzer Kugelschreiber, ergonomisches Design',
    rate: 12.50,
    unit: 'Box',
    category: 'Büromaterial',
    taxRate: 19
  },
  {
    name: 'Notizbuch A5',
    description: 'Liniertes Notizbuch, 100 Blatt',
    rate: 3.99,
    unit: 'Stück',
    category: 'Büromaterial',
    taxRate: 19
  },
  {
    name: 'Klebeband 50mm',
    description: 'Transparentes Verpackungsklebeband, 50m Rolle',
    rate: 2.50,
    unit: 'Rolle',
    category: 'Büromaterial',
    taxRate: 19
  },
  {
    name: 'Ordner (5er Pack)',
    description: 'Kunststoffordner A4, verschiedene Farben',
    rate: 15.99,
    unit: 'Pack',
    category: 'Büromaterial',
    taxRate: 19
  },

  // Software & IT Services
  {
    name: 'Microsoft Office Lizenz (1 Jahr)',
    description: 'Office 365 Single User Annual License',
    rate: 69.99,
    unit: 'Lizenz',
    category: 'Software',
    taxRate: 19
  },
  {
    name: 'Antivirus Software (12 Monate)',
    description: 'Premium Antivirus für 1 Computer',
    rate: 39.99,
    unit: 'Lizenz',
    category: 'Software',
    taxRate: 19
  },
  {
    name: 'Cloud Storage 1TB (12 Monate)',
    description: 'Sicherer Cloud-Speicher mit Backup',
    rate: 59.99,
    unit: 'Abo',
    category: 'Software',
    taxRate: 19
  },

  // Packaging & Shipping
  {
    name: 'Versandkarton 20x15x10cm',
    description: 'Wellpappe-Versandkarton, braun',
    rate: 1.20,
    unit: 'Stück',
    category: 'Verpackung',
    taxRate: 19
  },
  {
    name: 'Versandpolster (Luftpolsterfolie)',
    description: '1m x 50cm, 10mm Blasen',
    rate: 8.50,
    unit: 'Rolle',
    category: 'Verpackung',
    taxRate: 19
  },
  {
    name: 'Versandetiketten (1000 Stück)',
    description: '10x15cm selbstklebend, weiß',
    rate: 24.99,
    unit: 'Pack',
    category: 'Verpackung',
    taxRate: 19
  },

  // Electronics & Hardware
  {
    name: 'USB-C Kabel 2m',
    description: 'Schnellladekabel, zertifiziert, schwarz',
    rate: 15.99,
    unit: 'Stück',
    category: 'Elektronik',
    taxRate: 19
  },
  {
    name: 'Externe Festplatte 1TB',
    description: 'USB 3.0, tragbar, schwarz',
    rate: 59.99,
    unit: 'Stück',
    category: 'Elektronik',
    taxRate: 19
  },
  {
    name: 'HDMI Kabel 2m',
    description: '4K-kompatibel, hochwertige Qualität',
    rate: 12.50,
    unit: 'Stück',
    category: 'Elektronik',
    taxRate: 19
  },

  // Services & Consulting
  {
    name: 'Webdesign Grundpaket',
    description: '5 Seiten HTML/CSS Website',
    rate: 499.00,
    unit: 'Projekt',
    category: 'Dienstleistung',
    taxRate: 19
  },
  {
    name: 'SEO Optimierung (Stundensatz)',
    description: 'Professionelle Suchmaschinen-Optimierung',
    rate: 75.00,
    unit: 'Stunde',
    category: 'Dienstleistung',
    taxRate: 19
  },
  {
    name: 'IT Systemadministration (monatlich)',
    description: 'Netzwerk- und Systemverwaltung',
    rate: 350.00,
    unit: 'Monat',
    category: 'Dienstleistung',
    taxRate: 19
  },

  // Miscellaneous
  {
    name: 'Kaffee Kaffeepads (100er Pack)',
    description: 'Premium arabica Kaffee für Paddmaschinen',
    rate: 18.99,
    unit: 'Pack',
    category: 'Sonstiges',
    taxRate: 19
  },
  {
    name: 'LED Schreibtischlampe',
    description: 'Dimmbar, USB-laden, energieeffizient',
    rate: 29.99,
    unit: 'Stück',
    category: 'Sonstiges',
    taxRate: 19
  },
  {
    name: 'Ergonomisches Sitzkissen',
    description: 'Orthopädisches Bürokissen mit Gel',
    rate: 45.99,
    unit: 'Stück',
    category: 'Sonstiges',
    taxRate: 19
  }
];

async function seedItems() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/billingDB');
    console.log('✅ Connected to MongoDB');

    // Clear existing items (optional - comment out if you want to keep existing items)
    // await Item.deleteMany({});
    // console.log('🗑️  Cleared existing items');

    // Insert new items
    const createdItems = await Item.insertMany(items);
    console.log(`✅ Successfully added ${createdItems.length} items!`);

    // Display summary
    console.log('\n📋 Items Added:');
    createdItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - €${item.rate.toFixed(2)} (${item.unit})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding items:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate items detected. Some items may already exist.');
    }
    process.exit(1);
  }
}

seedItems();