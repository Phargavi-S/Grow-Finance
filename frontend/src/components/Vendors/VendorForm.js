import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VendorForm = ({ vendor, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPin: '',
    billingCountry: 'India',
    paymentTerms: 'Due on Receipt',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        billingAddress: vendor.billingAddress || '',
        billingCity: vendor.billingCity || '',
        billingState: vendor.billingState || '',
        billingPin: vendor.billingPin || '',
        billingCountry: vendor.billingCountry || 'India',
        paymentTerms: vendor.paymentTerms || 'Due on Receipt',
        notes: vendor.notes || ''
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Vendor name is required');
      setLoading(false);
      return;
    }

    try {
      if (vendor) {
        await axios.put(`/vendors/${vendor._id}`, formData, { withCredentials: true });
      } else {
        await axios.post('/vendors', formData, { withCredentials: true });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving vendor:', error);
      setError(error.response?.data?.error || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h2>{vendor ? 'Edit Vendor' : 'New Vendor'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Vendor Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Payment Terms</label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Billing Address</label>
            <textarea
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="billingCity"
              value={formData.billingCity}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              name="billingState"
              value={formData.billingState}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Pin Code</label>
            <input
              type="text"
              name="billingPin"
              value={formData.billingPin}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="billingCountry"
              value={formData.billingCountry}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Create Vendor')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;