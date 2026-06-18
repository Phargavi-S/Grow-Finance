import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import VendorForm from './VendorForm';
import VendorList from './VendorList';

const Vendors = ({ onLogout, user }) => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('/vendors', { withCredentials: true });
      setVendors(res.data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/vendors/${id}`, { withCredentials: true });
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVendor(null);
    fetchVendors();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Vendor Management</h1>
            <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Vendor</button>
          </div>

          {showForm ? (
            <VendorForm
              vendor={editingVendor}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowForm(false); setEditingVendor(null); }}
            />
          ) : (
            <VendorList
              vendors={vendors}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Vendors;