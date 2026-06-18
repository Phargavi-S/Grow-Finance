const RecurringInvoice = require('../models/RecurringInvoice');
const Customer = require('../models/Customer');
const { processPlan } = require('../services/recurringService');

const createRecurring = async (req, res) => {
  try {
    const { customerId, items, frequency = 'MONTHLY', startDate, endDate, cycles, name, closingText, dueDate, autoSendEmail = false, vatRate = 19 } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Customer and items are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    const plan = new RecurringInvoice({
      name,
      customerId,
      items,
      frequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      cycles,
      nextRun: startDate ? new Date(startDate) : new Date(),
      status: 'ACTIVE',
      closingText,
      dueDate,
      autoSendEmail,
      vatRate
    });

    await plan.save();
    res.json({ success: true, plan });

  } catch (err) {
    console.error('Create recurring error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRecurrings = async (req, res) => {
  try {
    const plans = await RecurringInvoice.find().populate('customerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getRecurring = async (req, res) => {
  try {
    const plan = await RecurringInvoice.findById(req.params.id).populate('customerId');
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateRecurring = async (req, res) => {
  try {
    const update = req.body;
    if (update.startDate) update.startDate = new Date(update.startDate);
    if (update.endDate) update.endDate = new Date(update.endDate);
    if (update.vatRate !== undefined) update.vatRate = Number(update.vatRate);
    if (update.autoSendEmail !== undefined) update.autoSendEmail = !!update.autoSendEmail;

    const plan = await RecurringInvoice.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const pauseRecurring = async (req, res) => {
  try {
    const plan = await RecurringInvoice.findByIdAndUpdate(req.params.id, { status: 'PAUSED' }, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const resumeRecurring = async (req, res) => {
  try {
    const plan = await RecurringInvoice.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });
    plan.status = 'ACTIVE';
    if (!plan.nextRun) plan.nextRun = new Date();
    await plan.save();
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteRecurring = async (req, res) => {
  try {
    const plan = await RecurringInvoice.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const triggerRecurring = async (req, res) => {
  try {
    const plan = await RecurringInvoice.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Recurring plan not found' });

    const invoice = await processPlan(plan);
    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Trigger recurring error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createRecurring,
  getRecurrings,
  getRecurring,
  updateRecurring,
  pauseRecurring,
  resumeRecurring,
  deleteRecurring,
  triggerRecurring
};
