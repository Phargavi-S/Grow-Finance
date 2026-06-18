import React from 'react';

const VendorList = ({ vendors = [], loading, onEdit, onDelete }) => {
  if (loading) return <div className="loading">Loading...</div>;
  if (!vendors || vendors.length === 0) return <div className="empty-state">No vendors found. Add your first vendor!</div>;

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>Payment Terms</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v._id}>
              <td>{v.name}</td>
              <td>{v.email || '-'}</td>
              <td>{v.phone || '-'}</td>
              <td>{v.billingCity || '-'}</td>
              <td>{v.paymentTerms || '-'}</td>
              <td>
                <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => onEdit(v)}>Edit</button>
                <button className="btn-outline" style={{ color: 'var(--danger)' }} onClick={() => onDelete(v._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorList;