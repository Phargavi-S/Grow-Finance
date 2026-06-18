import React from 'react';

const CustomerList = ({ customers = [], loading, onEdit, onDelete }) => {
  if (loading) return <div className="loading">Loading...</div>;
  if (!customers || customers.length === 0) return <div className="empty-state">No customers found. Add your first customer!</div>;

  const showCustomerType = customers.some((c) => c.customerType);

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {showCustomerType && <th>Customer Type</th>}
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              {showCustomerType && <td>{c.customerType || '-'}</td>}
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.phone || '-'}</td>
              <td>
                <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => onEdit(c)}>Edit</button>
                <button className="btn-outline" style={{ color: 'var(--danger)' }} onClick={() => onDelete(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerList;