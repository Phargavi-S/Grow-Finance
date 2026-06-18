import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecurringForm = ({ plan, onSuccess, onCancel }) => {
  const [customers, setCustomers] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [name, setName] = useState(plan?.name || 'Recurring Invoice');
  const [customerId, setCustomerId] = useState(plan?.customerId?._id || plan?.customerId || '');
  const [items, setItems] = useState(plan?.items && plan.items.length ? plan.items.map(it => ({ itemId: '', name: it.name || '', quantity: it.quantity || 1, rate: it.rate || 0 })) : [{ itemId: '', name: '', quantity: 1, rate: 0 }] );
  const [frequency, setFrequency] = useState(plan?.frequency || 'MONTHLY');
  const [startDate, setStartDate] = useState(plan?.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '');
  const [cycles, setCycles] = useState(plan?.cycles || '');
  const [closingText, setClosingText] = useState(plan?.closingText || '');
  const [dueDate, setDueDate] = useState(plan?.dueDate ? new Date(plan.dueDate).toISOString().split('T')[0] : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSendEmail, setAutoSendEmail] = useState(plan?.autoSendEmail || false);
  const [vatRate, setVatRate] = useState(plan?.vatRate || 19);

  useEffect(() => { 
    fetchCustomers(); 
    fetchItems();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err) { console.error('Fetch customers failed', err); }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('/items');
      setAvailableItems(res.data.items || []);
    } catch (err) { console.error('Fetch items failed', err); }
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it,i) => {
      if (i !== index) return it;
      const nextItem = { ...it, [field]: value };
      if (field === 'itemId') {
        const selectedItem = availableItems.find(item => item._id === value);
        if (selectedItem) {
          nextItem.itemId = selectedItem._id;
          nextItem.name = selectedItem.name;
          nextItem.rate = selectedItem.rate;
        }
      }
      return nextItem;
    }));
  };

  const addRow = () => setItems(prev => [...prev, { itemId: '', name: '', quantity: 1, rate: 0 }]);
  const removeRow = (index) => setItems(prev => prev.filter((_,i)=>i!==index));

  const handleSave = async () => {
    if (!customerId) { setError('Select customer'); return; }
    if (!items.length || items.some(it => !it.name || parseFloat(it.rate) <= 0)) { setError('Fill item details'); return; }

    setLoading(true); setError('');
    try {
      const payload = {
        name,
        customerId,
        items: items.map(it => ({ name: it.name, description: it.description || it.name, quantity: Number(it.quantity || 1), rate: Number(it.rate || 0), amount: Number(it.amount || (Number(it.quantity || 1) * Number(it.rate || 0))) })),
        frequency,
        startDate: startDate || null,
        endDate: endDate || null,
        cycles: cycles ? Number(cycles) : undefined,
        closingText,
        dueDate: dueDate || null,
        autoSendEmail,
        vatRate: Number(vatRate || 0)
      };

      let res;
      if (plan && plan._id) {
        res = await axios.put(`/recurring/${plan._id}`, payload);
      } else {
        res = await axios.post('/recurring', payload);
      }

      if (res.data && res.data.success) {
        if (onSuccess) onSuccess(res.data.plan || res.data);
      } else {
        setError('Save failed');
      }
    } catch (err) {
      console.error('Save recurring failed', err);
      setError(err.response?.data?.error || err.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: '16px', marginTop: '12px' }}>
      <h3>{plan? 'Edit Recurring Plan' : 'Create Recurring Plan'}</h3>
      {error && <div className="error-message">{error}</div>}
      <div className="form-row">
        <div className="form-group">
          <label>Plan Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <h4>Items</h4>
        <table className="item-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Rate (€)</th><th></th></tr></thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td>
                  <select value={it.itemId} onChange={(e) => updateItem(idx, 'itemId', e.target.value)}>
                    <option value="">Select Item</option>
                    {availableItems.map((item) => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </select>
                  <input placeholder="Or custom name" value={it.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} style={{ marginTop: '6px' }} />
                </td>
                <td><input type="number" min="0" step="1" value={it.quantity} onChange={e => updateItem(idx,'quantity', e.target.value)} /></td>
                <td><input type="number" min="0" step="0.01" value={it.rate} onChange={e => updateItem(idx,'rate', e.target.value)} /></td>
                <td>{items.length>1 && <button className="btn-danger" onClick={() => removeRow(idx)}>Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '8px' }}><button className="btn-secondary" onClick={addRow}>+ Add Row</button></div>
      </div>

      <div className="form-row" style={{ marginTop: '12px' }}>
        <div className="form-group">
          <label>Frequency</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)}>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: '8px' }}>
        <div className="form-group"><label>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
        <div className="form-group"><label>Cycles</label><input type="number" min="0" value={cycles} onChange={e => setCycles(e.target.value)} /></div>
      </div>

      <div className="form-row" style={{ marginTop: '8px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Closing Text</label>
          <textarea rows={2} value={closingText} onChange={e => setClosingText(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="form-row" style={{ marginTop: '8px' }}>
        <div className="form-group">
          <label>VAT Rate (%)</label>
          <input type="number" min="0" step="0.01" value={vatRate} onChange={e => setVatRate(e.target.value)} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: 8 }}>Auto Send Email</label>
          <input type="checkbox" checked={autoSendEmail} onChange={e => setAutoSendEmail(e.target.checked)} />
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '12px' }}>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : (plan ? 'Update' : 'Create')}</button>
      </div>
    </div>
  );
};

export default RecurringForm;
