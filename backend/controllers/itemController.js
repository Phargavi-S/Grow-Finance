const Item = require('../models/Item');

// Create new item
const createItem = async (req, res) => {
  try {
    console.log('📝 Creating item with data:', req.body);
    
    const { name, description, rate, hsnCode, taxRate, unit, category } = req.body;
    
    if (!name || !rate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item name and rate are required' 
      });
    }
    
    const item = new Item({
      name,
      description: description || '',
      rate: parseFloat(rate),
      hsnCode: hsnCode || '',
      taxRate: taxRate || 18,
      unit: unit || 'Nos',
      category: category || 'General',
      createdAt: new Date()
    });
    
    await item.save();
    console.log('✅ Item created successfully:', item._id);
    
    res.status(201).json({ 
      success: true, 
      item,
      message: 'Item created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating item:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all items
const getItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });
    console.log(`📋 Found ${items.length} items`);
    res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Error fetching items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.log('✅ Item updated:', item._id);
    res.json({ success: true, item });
  } catch (error) {
    console.error('❌ Error updating item:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.log('✅ Item deleted:', item._id);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem
};