const express = require('express');
const { createVendor, getVendors, getVendor, updateVendor, deleteVendor } = require('../controllers/vendorController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/', createVendor);
router.get('/', getVendors);
router.get('/:id', getVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

module.exports = router;
