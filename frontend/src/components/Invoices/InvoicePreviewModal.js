import React from 'react';

const InvoicePreviewModal = ({ invoice, previewHtml, onClose, onConfirm, loading, onEdit, onDelete }) => {
  const handlePrint = () => {
    const frame = document.getElementById('invoice-preview-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      return;
    }
    window.print();
  };

  const handleSendMail = () => {
    onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div id="preview-content" className="invoice-preview-paper">
          {previewHtml ? (
            <iframe
              id="invoice-preview-frame"
              title="Invoice preview"
              className="invoice-preview-frame"
              srcDoc={previewHtml}
            />
          ) : (
            <div className="loading">Loading invoice preview...</div>
          )}
        </div>
        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button className="btn-secondary" onClick={handlePrint}>Print Hard Copy</button>
          {invoice && invoice._id && (
            <button className="btn-primary" onClick={handleSendMail} disabled={loading}>Send Mail</button>
          )}
          {onEdit && <button className="btn-secondary" onClick={() => onEdit(invoice)}>Edit</button>}
          {onDelete && <button className="btn-secondary" onClick={() => { if (window.confirm('Delete this invoice?')) onDelete(invoice._id); }}>Delete</button>}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
