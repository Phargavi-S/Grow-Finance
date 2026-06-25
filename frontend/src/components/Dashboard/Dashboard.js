import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiDollarSign, FiUsers, FiFileText, FiTruck, FiShoppingCart
} from 'react-icons/fi';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import KPICard from '../Common/KPICard';

const Dashboard = ({ onLogout, user }) => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
    totalVendors: 0,
    totalExpenses: 0
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes, customersRes, vendorsRes, purchaseOrdersRes] = await Promise.all([
        axios.get('/invoices/dashboard-stats', { withCredentials: true }),
        axios.get('/invoices', { withCredentials: true }),
        axios.get('/customers', { withCredentials: true }),
        axios.get('/vendors', { withCredentials: true }),
        axios.get('/purchase-orders', { withCredentials: true })
      ]);

      const dashboardStats = statsRes.data.success ? (statsRes.data.stats || {}) : {};
      const customers = customersRes.data.success ? (customersRes.data.customers || []) : [];
      const vendors = vendorsRes.data.success ? (vendorsRes.data.vendors || []) : [];
      const purchaseOrders = purchaseOrdersRes.data.success ? (purchaseOrdersRes.data.purchaseOrders || []) : [];

      const totalExpenses = purchaseOrders.reduce((sum, po) => sum + (po.total || 0), 0);

      setStats({
        ...dashboardStats,
        totalCustomers: customers.length,
        totalVendors: vendors.length,
        totalExpenses
      });

      if (invoicesRes.data.success) setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = value || 0;
    return typeof num === 'number' ? `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';
  };

  const kpiCards = [
    {
      icon: <FiDollarSign />,
      title: 'Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `${stats.paidInvoices || 0} paid invoices`,
      accent: 'revenue'
    },
    {
      icon: <FiUsers />,
      title: 'Customers',
      value: stats.totalCustomers || 0,
      subtitle: 'Active customer accounts',
      accent: 'customers'
    },
    {
      icon: <FiFileText />,
      title: 'Invoices',
      value: stats.totalInvoices || 0,
      subtitle: `${stats.unpaidInvoices || 0} unpaid`,
      accent: 'invoices'
    },
    {
      icon: <FiTruck />,
      title: 'Vendors',
      value: stats.totalVendors || 0,
      subtitle: 'Registered vendors',
      accent: 'vendors'
    },
    {
      icon: <FiShoppingCart />,
      title: 'Expenses',
      value: formatCurrency(stats.totalExpenses),
      subtitle: 'Total purchase order value',
      accent: 'expenses'
    }
  ];

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header onLogout={onLogout} user={user} />
          <div className="content-area">
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <div>
              <h1 className="page-title">Financial Overview</h1>
              <p className="page-subtitle">Real-time insights from your business data</p>
            </div>
          </div>

          <div className="kpi-grid">
            {kpiCards.map((card) => (
              <KPICard key={card.title} {...card} />
            ))}
          </div>

          <div className="dashboard-section">
            <h2 className="dashboard-section-title">Recent Invoices</h2>
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
                      <td colSpan="8" style={{ textAlign: 'center' }}>No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
