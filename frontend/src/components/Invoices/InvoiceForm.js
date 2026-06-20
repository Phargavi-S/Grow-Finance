import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const InvoiceForm = ({ invoice, onSuccess, onCancel }) => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([{ itemId: '', name: '', quantity: 1, rate: 0, discount: 0, taxRate: 19 }]);
  const [invoiceData, setInvoiceData] = useState({
    orderNumber: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
    salesperson: '', priceList: 'Standard', shippingCharges: 0, adjustment: 0,
    terms: 'Due on Receipt', notes: '', closingText: '', reminderFrequency: 'None'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  useEffect(() => {
    if (invoice) {
      // Prefill form for editing
      setSelectedCustomer(invoice.customerId?._id || invoice.customerId || '');
      setInvoiceItems((invoice.items && invoice.items.length > 0) ? invoice.items.map(it => ({ itemId: '', name: it.name || it.description || '', quantity: it.quantity || 1, rate: it.rate || it.unitPrice || 0, discount: it.discount || 0, taxRate: it.taxRate || 19 })) : [{ itemId: '', name: '', quantity: 1, rate: 0, discount: 0, taxRate: 19 }]);
      setInvoiceData(prev => ({
        ...prev,
        orderNumber: invoice.orderNumber || prev.orderNumber,
        invoiceDate: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : prev.invoiceDate,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : prev.dueDate,
        terms: invoice.terms || prev.terms,
        notes: invoice.notes || prev.notes,
        reminderFrequency: invoice.reminderFrequency || 'None'
      }));
    }
  }, [invoice]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/customers', { withCredentials: true });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('/items', { withCredentials: true });
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const parseNumber = (value) => {
    const number = parseFloat(value);
    return Number.isNaN(number) ? 0 : number;
  };

  const calculateItemAmount = useCallback(({ quantity, rate, discount, taxRate }) => {
    const qty = parseNumber(quantity);
    const rt = parseNumber(rate);
    const disc = parseNumber(discount);
    const tax = parseNumber(taxRate);
    const base = qty * rt;
    const discountAmount = base * (disc / 100);
    const afterDiscount = base - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    return parseFloat((afterDiscount + taxAmount).toFixed(2));
  }, []);

  const invoiceItemsWithAmounts = useMemo(
    () => invoiceItems.map((item) => ({ ...item, amount: calculateItemAmount(item) })),
    [invoiceItems, calculateItemAmount]
  );

  const totals = useMemo(() => {
    const subTotal = invoiceItemsWithAmounts.reduce((sum, item) => sum + item.amount, 0);
    const shippingCharges = parseNumber(invoiceData.shippingCharges);
    const adjustment = parseNumber(invoiceData.adjustment);
    const rawTotal = subTotal + shippingCharges + adjustment;
    const roundOff = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2));
    const totalAmount = parseFloat((rawTotal + roundOff).toFixed(2));
    const totalQuantity = invoiceItemsWithAmounts.reduce((sum, item) => sum + parseNumber(item.quantity), 0);
    return { subTotal, shippingCharges, adjustment, roundOff, totalAmount, totalQuantity };
  }, [invoiceItemsWithAmounts, invoiceData.shippingCharges, invoiceData.adjustment]);

  const updateInvoiceItem = (index, field, value) => {
    setInvoiceItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextItem = { ...item, [field]: value };
        if (field === 'itemId') {
          const selectedItem = items.find((i) => i._id === value);
          if (selectedItem) {
            nextItem.itemId = selectedItem._id;
            nextItem.name = selectedItem.name;
            nextItem.rate = selectedItem.rate;
            nextItem.taxRate = selectedItem.taxRate ?? 19;
          }
        }
        return nextItem;
      })
    );
  };

  const addRow = () => {
    setInvoiceItems((prev) => [...prev, { itemId: '', name: '', quantity: 1, rate: 0, discount: 0, taxRate: 19 }]);
  };

  
  const resetForm = () => {
    setSelectedCustomer('');
    setInvoiceItems([{ itemId: '', name: '', quantity: 1, rate: 0, discount: 0, taxRate: 19 }]);
    setInvoiceData({
      orderNumber: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', salesperson: '',
      priceList: 'Standard', shippingCharges: 0, adjustment: 0, terms: 'Due on Receipt', notes: '', closingText: '', reminderFrequency: 'None'
    });
  };

  const handleSave = async (status, sendEmail = false) => {
    if (!selectedCustomer) {
      setError('Select customer');
      return;
    }
    if (invoiceItems.some((item) => !item.name || parseNumber(item.rate) <= 0)) {
      setError('Fill all item details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerId: selectedCustomer,
        salesperson: invoiceData.salesperson,
        priceList: invoiceData.priceList,
        status,
        sendEmail,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        terms: invoiceData.terms,
        shippingCharges: parseNumber(invoiceData.shippingCharges),
        adjustment: parseNumber(invoiceData.adjustment),
        notes: invoiceData.notes,
        closingText: invoiceData.closingText,
        reminderFrequency: invoiceData.reminderFrequency,
        items: invoiceItemsWithAmounts.map(({ itemId, name, quantity, rate, discount, taxRate, amount }) => ({ itemId, name, quantity, rate, discount, taxRate, amount })),
        subTotal: totals.subTotal,
        roundOff: totals.roundOff,
        totalAmount: totals.totalAmount,
        totalQuantity: totals.totalQuantity
      };

      let response;
      if (invoice && invoice._id) {
        // Update existing invoice
        response = await axios.put(`/invoices/${invoice._id}`, { ...payload, sendEmail: sendEmail }, { withCredentials: true });
        if (response.data && response.data.invoice && response.data.invoice.orderNumber) {
          setInvoiceData(prev => ({ ...prev, orderNumber: response.data.invoice.orderNumber }));
        }
      } else {
        // Create new
        response = await axios.post('/invoices', payload, { withCredentials: true });
        if (response.data && response.data.invoice && response.data.invoice.orderNumber) {
          setInvoiceData(prev => ({ ...prev, orderNumber: response.data.invoice.orderNumber }));
        }
      }

      if (onSuccess) onSuccess();
      resetForm();
      alert(invoice ? 'Invoice updated successfully!' : 'Invoice created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3 className="form-title">Create Invoice</h3>
      <p style={{ marginTop: '4px', color: '#555', fontSize: '13px' }}>Create an invoice with Euro pricing and clear item details.</p>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label>Customer Name *</label>
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} required>
              <option value="">Select or add a customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Invoice #</label>
            <input value="Auto-generated" disabled style={{ background: '#f3f4f6' }} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Salesperson</label>
            <input value={invoiceData.salesperson} onChange={(e) => setInvoiceData({ ...invoiceData, salesperson: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Price List</label>
            <select value={invoiceData.priceList} onChange={(e) => setInvoiceData({ ...invoiceData, priceList: e.target.value })}>
              <option>Standard</option>
              <option>Wholesale</option>
              <option>Retail</option>
              <option>Premium</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Order Number</label>
            <input 
              value={invoiceData.orderNumber} 
              readOnly 
              placeholder="Auto-generated on save" 
              style={{ backgroundColor: '#f5f5f5' }}
            />
            <small style={{ color: '#666', fontSize: '11px' }}>Auto-generated consecutive number</small>
          </div>
          <div className="form-group">
            <label>Invoice Date *</label>
            <input type="date" value={invoiceData.invoiceDate} onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Terms</label>
            <select value={invoiceData.terms} onChange={(e) => setInvoiceData({ ...invoiceData, terms: e.target.value })}>
              <option>Due on Receipt</option>
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Net 60</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due Date *</label>
            <input type="date" value={invoiceData.dueDate} onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Reminder Frequency</label>
            <select value={invoiceData.reminderFrequency} onChange={(e) => setInvoiceData({ ...invoiceData, reminderFrequency: e.target.value })}>
              <option>None</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
        </div>

        <div className="invoice-layout">
          <div>
            <h4 style={{ margin: '20px 0 12px' }}>Item Details</h4>
            <div className="item-table-container">
              <table className="item-table">
                <thead>
                  <tr>
                            <th>ITEM</th>
                    <th>QTY</th>
                    <th>PRICE (€)</th>
                    <th>DISCOUNT (%)</th>
                    <th>VAT (%)</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, idx) => {
                    const quantity = parseNumber(item.quantity);
                    const rate = parseNumber(item.rate);
                    const discount = parseNumber(item.discount);
                    const taxRate = parseNumber(item.taxRate);
                    const itemTotal = quantity * rate;
                    const discountAmount = itemTotal * (discount / 100);
                    const afterDiscount = itemTotal - discountAmount;
                    const taxAmount = afterDiscount * (taxRate / 100);
                    const amount = parseFloat((afterDiscount + taxAmount).toFixed(2));

                    return (
                      <tr key={idx}>
                        <td>
                          <select value={item.itemId} onChange={(e) => updateInvoiceItem(idx, 'itemId', e.target.value)}>
                            <option value="">Select Item</option>
                            {items.map((i) => (
                              <option key={i._id} value={i._id}>{i.name}</option>
                            ))}
                          </select>
                          <input placeholder="Or custom name" value={item.name} onChange={(e) => updateInvoiceItem(idx, 'name', e.target.value)} style={{ marginTop: '6px' }} />
                        </td>
                        <td><input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateInvoiceItem(idx, 'quantity', e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateInvoiceItem(idx, 'rate', e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateInvoiceItem(idx, 'discount', e.target.value)} style={{ width: '90px' }} /></td>
                        <td>
                          <select value={item.taxRate} onChange={(e) => updateInvoiceItem(idx, 'taxRate', e.target.value)}>
                            <option value="0">0</option>
                            <option value="5">5</option>
                            <option value="12">12</option>
                            <option value="18">18</option>
                            <option value="28">28</option>
                          </select>
                        </td>
                        <td>€{amount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button type="button" className="add-row-btn" onClick={addRow}>+ Add New Row</button>
              <button type="button" className="add-row-btn" style={{ background: '#6b7280' }} onClick={() => alert('Add items in bulk placeholder')}>+ Add Items in Bulk</button>
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-card">
              <div className="summary-row"><span>Subtotal</span><span>€{totals.subTotal.toFixed(2)}</span></div>
              <div className="form-group"><label>Shipping Charges</label><input type="number" min="0" step="0.01" value={invoiceData.shippingCharges} onChange={(e) => setInvoiceData({ ...invoiceData, shippingCharges: e.target.value })} /></div>
              <div className="form-group"><label>Adjustment</label><input type="number" min="0" step="0.01" value={invoiceData.adjustment} onChange={(e) => setInvoiceData({ ...invoiceData, adjustment: e.target.value })} /></div>
              <div className="form-group"><label>Closing Text</label><textarea rows="2" value={invoiceData.closingText} onChange={(e) => setInvoiceData({ ...invoiceData, closingText: e.target.value })} placeholder="Optional closing text for invoice" /></div>
              <div className="summary-row"><span>Round Off</span><span>€{totals.roundOff.toFixed(2)}</span></div>
              <div className="summary-row total"><span>Total Amount</span><span>€{totals.totalAmount.toFixed(2)}</span></div>
              <div className="summary-row"><span>Total Quantity</span><span>{totals.totalQuantity}</span></div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-secondary" onClick={() => handleSave('DRAFT', false)}>Save as Draft</button>
          <button type="button" className="btn-primary" onClick={() => handleSave('SENT', true)} disabled={loading}>{loading ? 'Saving...' : 'Save and Send'}</button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
