const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getDashboardStats,
  sendInvoiceReminder   
} = require('../controllers/invoiceController');

const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// CREATE
router.post('/', createInvoice);

// GET ALL
router.get('/', getInvoices);

// DASHBOARD ( keep BEFORE /:id)
router.get('/dashboard-stats', getDashboardStats);

// GET ONE
router.get('/:id', getInvoice);

// FULL UPDATE (edit & optionally resend)
router.put('/:id', updateInvoice);

// UPDATE STATUS
router.put('/:id/status', updateInvoiceStatus);

// DELETE
router.delete('/:id', deleteInvoice);

// SEND REMINDER EMAIL
router.post('/:id/send-reminder', sendInvoiceReminder); // ✅ FIXED

module.exports = router;