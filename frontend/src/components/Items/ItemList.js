import React from 'react';

const ItemList = ({ items = [], loading, onEdit, onDelete }) => {
  const formatCurrency = (value) => {
    const num = value || 0;
    return typeof num === 'number' ? `€${num.toFixed(2)}` : '€0.00';
  };

  if (loading) return <div className="loading">Loading items...</div>;
  if (!items || items.length === 0) return <div className="empty-state">No items found. Add your first product!</div>;

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>HSN Code</th>
            <th>Rate (€)</th>
            <th>Tax Rate</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id}>
              <td>{item.name || '-'}</td>
              <td>{item.hsnCode || '-'}</td>
              <td>{formatCurrency(item.rate)}</td>
              <td>{item.taxRate || 0}%</td>
              <td>{item.unit || 'Nos'}</td>
              <td className="actions-cell">
                <button className="action-btn edit-btn" onClick={() => onEdit(item)}>Edit</button>
                <button className="action-btn delete-btn" onClick={() => onDelete(item._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemList;