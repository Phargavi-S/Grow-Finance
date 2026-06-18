import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ItemForm = ({ item, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', description: '', rate: '', hsnCode: '', taxRate: 18, unit: 'Nos' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) setFormData({ name: item.name, description: item.description || '', rate: item.rate, hsnCode: item.hsnCode || '', taxRate: item.taxRate, unit: item.unit });
  }, [item]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item) await axios.put(`/items/${item._id}`, formData, { withCredentials: true });
      else await axios.post('/items', formData, { withCredentials: true });
      onSuccess();
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-card">
      <h3 className="form-title">{item ? 'Edit Item' : 'Add New Item'}</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label>Item Name *</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
          <div className="form-group"><label>Rate (₹) *</label><input name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>HSN/SAC Code</label><input name="hsnCode" value={formData.hsnCode} onChange={handleChange} /></div>
          <div className="form-group"><label>Tax Rate (%)</label><select name="taxRate" value={formData.taxRate} onChange={handleChange}><option>0</option><option>5</option><option>12</option><option>18</option><option>28</option></select></div>
        </div>
        <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" /></div>
        <div className="form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : (item ? 'Update' : 'Create')}</button></div>
      </form>
    </div>
  );
};

export default ItemForm;