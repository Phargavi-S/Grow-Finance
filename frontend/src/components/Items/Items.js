import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import ItemForm from './ItemForm';
import ItemList from './ItemList';

const Items = ({ onLogout, user }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/items', { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data.items || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(res.data.items.map(item => item.category || item.section || 'General'))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => (item.category === selectedCategory || item.section === selectedCategory));

  const handleEdit = (item) => { setEditingItem(item); setShowForm(true); };
  
  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchItems();
      } catch (error) { console.error(error); alert('Failed to delete item'); }
    }
  };
  
  const handleSuccess = () => { setShowForm(false); setEditingItem(null); fetchItems(); };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Items / Products</h1>
            <button className="btn-primary" onClick={() => { setEditingItem(null); setShowForm(!showForm); }}>
              {showForm ? 'Cancel' : '+ Add Item'}
            </button>
          </div>
          
          {/* Category Filter */}
          <div className="category-filter" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setSelectedCategory('all')} 
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: selectedCategory === 'all' ? '#4F46E5' : 'white', color: selectedCategory === 'all' ? 'white' : '#333', cursor: 'pointer' }}
            >
              All Items ({items.length})
            </button>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)} 
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: selectedCategory === cat ? '#4F46E5' : 'white', color: selectedCategory === cat ? 'white' : '#333', cursor: 'pointer' }}
              >
                {cat} ({items.filter(i => i.category === cat || i.section === cat).length})
              </button>
            ))}
          </div>
          
          {showForm && <ItemForm item={editingItem} onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />}
          <ItemList items={filteredItems} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
};

export default Items;