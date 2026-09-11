import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';
import InvoicePreviewModal from './InvoicePreviewModal';

const Invoices = ({ onLogout, user }) => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/invoices', { withCredentials: true });
      setInvoices(res.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handlePreview = async (id) => {
    setPreviewLoading(true);
    try {
      const [res, htmlRes] = await Promise.all([
        axios.get(`/invoices/${id}`, { withCredentials: true }),
        axios.get(`/invoices/${id}/preview-html`, { withCredentials: true })
      ]);
      setPreviewInvoice(res.data.invoice);
      setPreviewHtml(htmlRes.data.html || '');
    } catch (error) {
      console.error('Error fetching invoice preview:', error);
      alert('Failed to load invoice preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`/invoices/${id}`, { withCredentials: true });
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingInvoice(null);
    fetchInvoices();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Invoices</h1>
            <button className="btn-primary" onClick={() => { setEditingInvoice(null); setShowForm(!showForm); }}>
              {showForm ? 'Cancel' : '+ Add Invoice'}
            </button>
          </div>
          {showForm && (
            <InvoiceForm
              invoice={editingInvoice}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          )}
          <InvoiceList
            invoices={invoices}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handlePreview}
            onStatusChange={fetchInvoices}
          />

          {previewInvoice && (
            <InvoicePreviewModal
              invoice={previewInvoice}
              previewHtml={previewHtml}
              loading={previewLoading}
              onClose={() => { setPreviewInvoice(null); setPreviewHtml(''); }}
              onConfirm={async () => {
                try {
                  const res = await axios.put(`/invoices/${previewInvoice._id}`, { sendEmail: true }, { withCredentials: true });
                  if (res.data?.emailSent) {
                    alert('Invoice resent successfully');
                  } else {
                    alert(res.data?.emailError || 'Invoice saved but email was not sent');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Failed to resend invoice');
                }
              }}
              onEdit={(inv) => { setPreviewInvoice(null); handleEdit(inv); }}
              onDelete={async (id) => { setPreviewInvoice(null); await handleDelete(id); }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;