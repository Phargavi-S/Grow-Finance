import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';

const Customers = ({ onLogout, user }) => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/customers', { withCredentials: true });
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/customers/${id}`, { withCredentials: true });
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Customers</h1>
            <button className="btn-primary" onClick={() => { setEditingCustomer(null); setShowForm(!showForm); }}>
              {showForm ? 'Cancel' : '+ Add Customer'}
            </button>
          </div>
          {showForm && (
            <CustomerForm 
              customer={editingCustomer} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setShowForm(false)} 
            />
          )}
          <CustomerList 
            customers={customers} 
            loading={loading} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </div>
      </div>
    </div>
  );
};

export default Customers;