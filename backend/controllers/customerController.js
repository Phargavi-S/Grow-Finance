const Customer = require('../models/Customer');

// Create new customer
const createCustomer = async (req, res) => {
  try {
    console.log('📝 Creating customer with data:', req.body);
    
    const { name, email, phone, workPhone, mobile, billingAddress, billingCity, billingState, billingPin, billingCountry } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required fields' 
      });
    }
    
    const customer = new Customer({
      name,
      email,
      phone: phone || '',
      workPhone: workPhone || '',
      mobile: mobile || '',
      billingAddress: billingAddress || '',
      billingCity: billingCity || '',
      billingState: billingState || '',
      billingPin: billingPin || '',
      billingCountry: billingCountry || 'India',
      createdAt: new Date()
    });
    
    await customer.save();
    console.log('✅ Customer created successfully:', customer._id);
    
    res.status(201).json({ 
      success: true, 
      customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get all customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    console.log(`📋 Found ${customers.length} customers`);
    res.json({ success: true, customers });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single customer
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, customer });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    console.log('✅ Customer updated:', customer._id);
    res.json({ success: true, customer });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    console.log('✅ Customer deleted:', customer._id);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer
};