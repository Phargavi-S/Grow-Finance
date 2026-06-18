import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';

const Dashboard = ({ onLogout, user }) => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
    totalPOs: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        axios.get('/api/invoices/dashboard-stats', { withCredentials: true }),
        axios.get('/api/invoices', { withCredentials: true })
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats || {});
      if (invoicesRes.data.success) setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = value || 0;
    return typeof num === 'number' ? `₹${num.toFixed(2)}` : '₹0.00';
  };

  const statCards = [
    { title: 'Total Revenue (Paid)', value: formatCurrency(stats.totalRevenue), sub: '' },
    { title: 'Total Customers', value: stats.totalCustomers || 0, sub: '' },
    { title: 'Total Invoices', value: stats.totalInvoices || 0, sub: '' },
    { title: 'Total Purchase Orders', value: stats.totalPOs || 0, sub: '' },
    { title: 'Paid Invoices', value: stats.paidInvoices || 0, sub: '' },
    { title: 'Unpaid Invoices', value: stats.unpaidInvoices || 0, sub: '' }
  ];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Financial Overview</h1>
          </div>
          <div className="stats-grid">
            {statCards.map((card, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-card-title">{card.title}</div>
                <div className="stat-card-value">{card.value}</div>
                {card.sub && <div className="stat-card-sub">{card.sub}</div>}
              </div>
            ))}
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice#</th>
                  <th>Customer Name</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Subtotal</th>
                  <th>Tax (18%)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices && invoices.length > 0 ? invoices.map(inv => (
                  <tr key={inv._id}>
                    <td>{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                    <td>{inv.invoiceNumber || '-'}</td>
                    <td>{inv.customerId?.name || 'N/A'}</td>
                    <td><span className={`status-badge status-${(inv.status || 'unpaid').toLowerCase()}`}>{inv.status?.replace('_', ' ') || 'UNPAID'}</span></td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                    <td>₹{(inv.subtotal || 0).toFixed(2)}</td>
                    <td>₹{(inv.tax || 0).toFixed(2)}</td>
                    <td>₹{(inv.total || 0).toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{textAlign: 'center'}}>No invoices found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;