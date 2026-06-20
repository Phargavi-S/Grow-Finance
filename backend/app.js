const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n========================================');
console.log(' GROW FINANCE');
console.log('========================================');
console.log(` PORT: ${process.env.PORT || 5000}`);
console.log(' MongoDB configuration loaded');
console.log('========================================\n');

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const itemRoutes = require('./routes/itemRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const recurringRoutes = require('./routes/recurringRoutes');

const app = express();

// Use frontend URL from env (Vercel) or default to localhost for dev
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const IS_PROD = process.env.NODE_ENV === 'production';

// When deployed behind a proxy (Render), trust the first proxy so secure cookies work
if (IS_PROD) app.set('trust proxy', 1);

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'billing_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // secure cookies in production (requires HTTPS). Keep false in dev.
    secure: IS_PROD,
    httpOnly: true,
    // allow cross-site cookies in production (frontend and backend are different hosts)
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CORS - allow requests from the configured frontend and credentials (cookies)
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/recurring', recurringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    success: true,
    message: 'Server is running',
    database: dbStatus,
    timestamp: new Date()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(` SERVER RUNNING`);
  console.log(`========================================`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` API: http://localhost:${PORT}/api`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n Port ${PORT} is already in use!`);
    console.error(`   Change PORT in .env file (e.g., PORT=5001)\n`);
  } else {
    console.error(' Server error:', err);
  }
  process.exit(1);
});

// Start recurring invoice scheduler (after server start)
try {
  const { startScheduler } = require('./scheduler/recurringScheduler');
  startScheduler();
} catch (err) {
  console.error('Failed to start recurring scheduler:', err.message);
}

// Start invoice reminder scheduler
try {
  const { startInvoiceReminderScheduler } = require('./scheduler/invoiceReminderScheduler');
  startInvoiceReminderScheduler();
} catch (err) {
  console.error('Failed to start invoice reminder scheduler:', err.message);
}