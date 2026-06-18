import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InvoiceList = ({ invoices, loading, onEdit, onDelete, onView }) => {
  const [updating, setUpdating] = useState(null);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axios.put(`/invoices/${id}/status`, { status }, { withCredentials: true });
      // Refresh will be handled by parent
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const sendReminder = async (id) => {
    setUpdating(id);
    try {
      await axios.post(`/invoices/${id}/send-reminder`, {}, { withCredentials: true });
      alert('Reminder sent successfully!');
    } catch (err) { 
      console.error(err);
      alert('Error sending reminder: ' + (err.response?.data?.error || err.message));
    }
    finally { setUpdating(null); }
  };

  if (loading) return <div className="loading">Loading invoices...</div>;
  if (!invoices.length) return <div className="empty-state">No invoices yet. Create your first invoice!</div>;

  const formatCurrency = (value) => {
    const num = value || 0;
    return typeof num === 'number' ? `€${num.toFixed(2)}` : '€0.00';
  };

  return (
    <div className="data-table-container" style={{ marginTop: '24px' }}>
      <h3 className="form-title">All Invoices</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th><th>Invoice#</th><th>Customer Name</th>
            <th>Status</th><th>Due Date</th><th>Tax (18%)</th><th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices && invoices.length > 0 ? invoices.map(inv => (
            <tr key={inv._id}>
              <td>{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
              <td>
                {inv.invoiceNumber || '-'}
                {inv.recurringId && (
                  <span style={{ marginLeft: 8, padding: '2px 6px', background: '#f0f9ff', color: '#0369a1', borderRadius: 4, fontSize: 12 }}>Recurring</span>
                )}
              </td>
              <td>{inv.customerId?.name || 'N/A'}</td>
              <td><span className={`status-badge status-${(inv.status || 'unpaid').toLowerCase()}`}>{inv.status?.replace('_', ' ') || 'UNPAID'}</span></td>
              <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
              <td>{formatCurrency(inv.tax)}</td>
              <td>{formatCurrency(inv.total)}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn-secondary" onClick={() => onEdit && onEdit(inv)} style={{ marginRight: '6px' }}>Edit</button>
                <button className="btn-secondary" onClick={() => onDelete && onDelete(inv._id)} style={{ marginRight: '6px' }}>Delete</button>
                {inv.status === 'UNPAID' && (
                  <button className="btn-secondary" onClick={() => sendReminder(inv._id)} style={{ marginRight: '6px' }} disabled={updating === inv._id}>
                    {updating === inv._id ? 'Sending...' : 'Reminder'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => onView && onView(inv._id)}>Preview</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="8" style={{textAlign: 'center'}}>No invoices found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;