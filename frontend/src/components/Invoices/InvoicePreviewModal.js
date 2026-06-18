import React from 'react';

const InvoicePreviewModal = ({ invoice, onClose, onConfirm, loading, onEdit, onDelete }) => {
  const customer = invoice.customer || invoice.customerId || {};
  const items = invoice.items || [];
  const subtotal = invoice.subtotal || items.reduce((s, it) => s + (it.amount || (it.quantity * (it.rate || it.unitPrice || 0))), 0) || 0;
  const tax = invoice.tax || 0;
  const total = invoice.total || invoice.totalAmount || subtotal + tax || 0;
  const invoiceDate = invoice.invoiceDate || invoice.date;
  const dispatchDate = invoice.dispatchDate || invoice.dispatchDate;
  const address = customer.billingAddress || invoice.address || '';

  const getUnitPrice = (item) => parseFloat(item.price || item.rate || item.unitPrice || 0) || 0;
  const getQuantity = (item) => parseFloat(item.quantity || 0) || 0;
  const getLineTotal = (item) => parseFloat(item.amount !== undefined ? item.amount : (getUnitPrice(item) * getQuantity(item))) || 0;

  const handlePrint = () => {
    const printContent = document.getElementById('preview-content').innerHTML;
    const original = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  const handleSendMail = () => {
    onConfirm(); // trigger confirm callback (resend or send)
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div id="preview-content" style={{ padding: '20px', fontFamily: 'Roboto' }}>
          <h1 style={{ fontFamily: 'Maitree', color: '#1a1a2e' }}>INVOICE</h1>
          <hr />
          <p><strong>Invoice Date:</strong> {invoiceDate}</p>
          <p><strong>Invoice Number:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Customer:</strong> {customer.name}, {customer.email}</p>
          <p><strong>Shipping Address:</strong> {address}</p>
          <p><strong>Dispatch Date:</strong> {dispatchDate}</p>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {items.map((item, i) => {
                const name = item.name || item.description || '';
                const qty = getQuantity(item);
                const unitPrice = getUnitPrice(item);
                const lineTotal = getLineTotal(item);
                return (
                  <tr key={i}>
                    <td>{name}</td>
                    <td>{qty}</td>
                    <td>€{unitPrice.toFixed(2)}</td>
                    <td>€{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <p>Subtotal: €{subtotal.toFixed(2)}</p>
            <p>VAT: €{tax.toFixed(2)}</p>
            <p><strong>Total: €{total.toFixed(2)}</strong></p>
          </div>
          <footer style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
            © 2026 Sairam Eng. M.Tech. All rights reserved.
          </footer>
        </div>
        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button className="btn-secondary" onClick={handlePrint}>🖨️ Print Hard Copy</button>
          {invoice && invoice._id && (
            <button className="btn-primary" onClick={handleSendMail} disabled={loading}>📧 Send Mail</button>
          )}
          {onEdit && <button className="btn-secondary" onClick={() => onEdit(invoice)} style={{ marginLeft: '8px' }}>✏️ Edit</button>}
          {onDelete && <button className="btn-danger" onClick={() => { if (window.confirm('Delete this invoice?')) onDelete(invoice._id); }} style={{ marginLeft: '8px' }}>🗑️ Delete</button>}
          <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '8px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;