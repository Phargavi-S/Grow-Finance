import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import axios from 'axios';

const PurchaseOrdersDashboard = ({ onLogout, user }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPOs: 0, openPOs: 0, draftPOs: 0 });
  const [pdfTemplate, setPdfTemplate] = useState('standard');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        axios.get('/purchase-orders', { withCredentials: true }),
        axios.get('/purchase-orders/dashboard-stats', { withCredentials: true })
      ]);

      if (listRes.data.success) setPurchaseOrders(listRes.data.purchaseOrders || []);
      if (statsRes.data.success) setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error('Error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statusColor = (s) => {
    switch ((s || '').toUpperCase()) {
      case 'DRAFT': return 'status-draft';
      case 'OPEN': return 'status-open';
      case 'RECEIVED': return 'status-received';
      case 'BILLED': return 'status-billed';
      case 'PAID': return 'status-paid';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">All Purchase Orders</h1>
            <button className="btn-primary" onClick={() => navigate('/purchase-orders/new')}>+ New</button>
          </div>

          <div className="stats-grid" style={{ marginTop: 12 }}>
            <div className="stat-card"><div className="stat-card-title">Total POs</div><div className="stat-card-value">{stats.totalPOs || 0}</div></div>
            <div className="stat-card"><div className="stat-card-title">Open POs</div><div className="stat-card-value">{stats.openPOs || 0}</div></div>
            <div className="stat-card"><div className="stat-card-title">Draft POs</div><div className="stat-card-value">{stats.draftPOs || 0}</div></div>
          </div>

          <div className="data-table-container" style={{ marginTop: 18 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor Name</th>
                  <th>Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Reference #</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Loading...</td></tr>
                ) : purchaseOrders.length ? purchaseOrders.map(po => (
                  <tr key={po._id}>
                    <td>{po.poNumber}</td>
                    <td>{po.vendorId?.name || po.vendorName}</td>
                    <td>{po.date ? new Date(po.date).toLocaleDateString() : '-'}</td>
                    <td>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '-'}</td>
                    <td><span className={`status-badge ${statusColor(po.status)}`}>{po.status}</span></td>
                    <td>{po.referenceNo || '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No purchase orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 18 }}>
            <label>PDF Template: </label>
            <select value={pdfTemplate} onChange={(e) => setPdfTemplate(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersDashboard;
