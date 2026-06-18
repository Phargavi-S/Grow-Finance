const express = require('express');
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  convertToBill,
  getStats
} = require('../controllers/purchaseOrderController');

const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// CREATE
router.post('/', createPurchaseOrder);

// GET ALL
router.get('/', getPurchaseOrders);

// DASHBOARD STATS
router.get('/dashboard-stats', getStats);

// GET ONE
router.get('/:id', getPurchaseOrder);

// GET PDF
router.get('/:id/pdf', async (req, res, next) => { return require('../controllers/purchaseOrderController').generatePOPdf(req, res, next); });

// UPDATE
router.put('/:id', updatePurchaseOrder);

// DELETE
router.delete('/:id', deletePurchaseOrder);

// CONVERT TO BILL
router.post('/:id/convert-to-bill', convertToBill);

module.exports = router;
