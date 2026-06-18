const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createRecurring,
  getRecurrings,
  getRecurring,
  updateRecurring,
  pauseRecurring,
  resumeRecurring,
  deleteRecurring,
  triggerRecurring
} = require('../controllers/recurringController');

router.use(authMiddleware);

router.post('/', createRecurring);
router.get('/', getRecurrings);
router.get('/:id', getRecurring);
router.put('/:id', updateRecurring);
router.post('/:id/pause', pauseRecurring);
router.post('/:id/resume', resumeRecurring);
router.delete('/:id', deleteRecurring);
router.post('/:id/trigger', triggerRecurring);

module.exports = router;
