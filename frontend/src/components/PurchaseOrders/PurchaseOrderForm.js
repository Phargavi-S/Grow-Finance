import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const PurchaseOrderForm = ({ onLogout, user }) => {
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([{ itemId: '', name: '', description: '', quantity: 1, rate: 0 }]);
  const [form, setForm] = useState({ vendorId: '', vendorName: '', deliveryAddress: '', referenceNo: '', date: new Date().toISOString().split('T')[0], deliveryDate: '', paymentTerms: 'Due on Receipt', shipmentPreference: '' });
  const [addressType, setAddressType] = useState('vendor');
  const [pdfTemplate, setPdfTemplate] = useState('standard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchVendors(); fetchItems(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('/vendors', { withCredentials: true });
      if (res.data.success) setVendors(res.data.vendors || []);
    } catch (err) { console.error('Fetch vendors error', err); }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('/items', { withCredentials: true });
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addItem = () => setSelectedItems(prev => [...prev, { itemId: '', name: '', description: '', quantity: 1, rate: 0 }]);
  const updateItem = (idx, key, value) => {
    setSelectedItems(prev => prev.map((it, i) => {
      if (i === idx) {
        const nextItem = { ...it, [key]: value };
        if (key === 'itemId') {
          const selectedItem = items.find(item => item._id === value);
          if (selectedItem) {
            nextItem.name = selectedItem.name;
            nextItem.description = selectedItem.description;
            nextItem.rate = selectedItem.rate;
          } else {
            nextItem.name = '';
            nextItem.description = '';
            nextItem.rate = 0;
          }
        }
        return nextItem;
      }
      return it;
    }));
  };
  const removeItem = (idx) => setSelectedItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async (status) => {
    if (!form.vendorId && !form.vendorName) return alert('Select or enter vendor');
    if (!selectedItems.length) return alert('Add at least one item');
    setLoading(true);
    try {
      const payload = {
        vendorId: form.vendorId || null,
        vendorName: form.vendorName || (vendors.find(v=>v._id===form.vendorId)?.name || ''),
        deliveryAddress: form.deliveryAddress,
        referenceNo: form.referenceNo,
        date: form.date,
        deliveryDate: form.deliveryDate,
        paymentTerms: form.paymentTerms,
        shipmentPreference: form.shipmentPreference,
        status,
        items: selectedItems
      };

      await axios.post('/purchase-orders', payload, { withCredentials: true });
      navigate('/purchase-orders');
    } catch (err) {
      console.error('Save PO error', err);
      alert(err.response?.data?.error || 'Failed to save purchase order');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">New Purchase Order</h1>
          </div>

          <div className="form-card">
            <div className="form-row">
              <div className="form-group">
                <label>Vendor Name *</label>
                <select value={form.vendorId} onChange={(e)=> setForm({...form, vendorId: e.target.value})}>
                  <option value="">Select vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
                <small style={{display:'block', marginTop:6}}>Or type a vendor name below</small>
                <input style={{marginTop:6}} placeholder="Vendor name" value={form.vendorName} onChange={(e)=> setForm({...form, vendorName: e.target.value})} />
              </div>

              <div className="form-group">
                <label>PO Number</label>
                <input value="Auto-generated" disabled style={{ background: '#f3f4f6' }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Delivery Address</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <label><input type="radio" checked={addressType==='vendor'} onChange={()=> setAddressType('vendor')} /> Organization</label>
                  <label><input type="radio" checked={addressType==='custom'} onChange={()=> setAddressType('custom')} /> Custom</label>
                </div>
                <textarea rows={3} value={form.deliveryAddress} onChange={(e)=> setForm({...form, deliveryAddress: e.target.value})} placeholder={addressType==='vendor' ? 'Will use vendor address if left empty' : 'Enter delivery address'} />
              </div>

              <div className="form-group">
                <label>Reference #</label>
                <input value={form.referenceNo} onChange={(e)=> setForm({...form, referenceNo: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e)=> setForm({...form, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Delivery Date</label>
                <input type="date" value={form.deliveryDate} onChange={(e)=> setForm({...form, deliveryDate: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payment Terms</label>
                <select value={form.paymentTerms} onChange={(e)=> setForm({...form, paymentTerms: e.target.value})}>
                  <option>Due on Receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </select>
              </div>
              <div className="form-group">
                <label>Shipment Preference</label>
                <select value={form.shipmentPreference} onChange={(e)=> setForm({...form, shipmentPreference: e.target.value})}>
                  <option value="">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h4>Items</h4>
              <table className="item-table">
                <thead>
                  <tr><th>Item</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {selectedItems.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <select value={it.itemId} onChange={(e) => updateItem(idx, 'itemId', e.target.value)} style={{width: '100%'}}>
                          <option value="">Select item</option>
                          {items.map(item => (
                            <option key={item._id} value={item._id}>{item.name} - €{item.rate}</option>
                          ))}
                        </select>
                      </td>
                      <td><input value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" /></td>
                      <td><input type="number" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                      <td><input type="number" value={it.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></td>
                      <td>€{(Number(it.quantity || 0) * Number(it.rate || 0)).toFixed(2)}</td>
                      <td><button type="button" onClick={() => removeItem(idx)} className="btn-secondary">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8 }}><button type="button" className="add-row-btn" onClick={addItem}>+ Add Item</button></div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label>PDF Template: </label>
              <select value={pdfTemplate} onChange={(e)=> setPdfTemplate(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => navigate('/purchase-orders')}>Cancel</button>
              <button className="btn-secondary" onClick={() => handleSave('DRAFT')}>Save as Draft</button>
              <button className="btn-primary" onClick={() => handleSave('OPEN')} disabled={loading}>{loading ? 'Saving...' : 'Save and Send'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
