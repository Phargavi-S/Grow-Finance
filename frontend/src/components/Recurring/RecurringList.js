import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecurringForm from '../Invoices/RecurringForm';

const RecurringList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/recurring');
      setPlans(res.data.plans || []);
    } catch (err) { console.error('Fetch recurring failed', err); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingPlan(null); setShowForm(true); };
  const handleEdit = (plan) => { setEditingPlan(plan); setShowForm(true); };

  const handlePause = async (id) => {
    try { await axios.post(`/recurring/${id}/pause`); fetchPlans(); } catch (err) { console.error(err); }
  };

  const handleResume = async (id) => {
    try { await axios.post(`/recurring/${id}/resume`); fetchPlans(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete recurring plan?')) return;
    try { await axios.delete(`/recurring/${id}`); fetchPlans(); } catch (err) { console.error(err); }
  };

  const handleTrigger = async (id) => {
    try { await axios.post(`/recurring/${id}/trigger`); alert('Triggered'); fetchPlans(); } catch (err) { console.error(err); alert('Trigger failed'); }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="form-title">Recurring Plans</h3>
        <div>
          <button className="btn-secondary" onClick={handleCreate}>+ New Recurring</button>
          <button className="btn-secondary" onClick={fetchPlans} style={{ marginLeft: 8 }}>Refresh</button>
        </div>
      </div>

      {showForm && (
        <RecurringForm plan={editingPlan} onSuccess={(p) => { setShowForm(false); setEditingPlan(null); fetchPlans(); }} onCancel={() => { setShowForm(false); setEditingPlan(null); }} />
      )}

      {loading ? <div>Loading plans...</div> : (
        <table className="data-table" style={{ marginTop: 12 }}>
          <thead><tr><th>Name</th><th>Customer</th><th>Frequency</th><th>Next Run</th><th>Status</th><th>Count</th><th>Actions</th></tr></thead>
          <tbody>
            {plans.length ? plans.map(p => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.customerId?.name || '-'}</td>
                <td>{p.frequency}</td>
                <td>{p.nextRun ? new Date(p.nextRun).toLocaleString() : '-'}</td>
                <td>{p.status}</td>
                <td>{p.generatedCount || 0}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-secondary" onClick={() => handleEdit(p)} style={{ marginRight: 6 }}>Edit</button>
                  {p.status === 'ACTIVE' ? (
                    <button className="btn-secondary" onClick={() => handlePause(p._id)} style={{ marginRight: 6 }}>Pause</button>
                  ) : (
                    <button className="btn-secondary" onClick={() => handleResume(p._id)} style={{ marginRight: 6 }}>Resume</button>
                  )}
                  <button className="btn-secondary" onClick={() => handleTrigger(p._id)} style={{ marginRight: 6 }}>Trigger</button>
                  <button className="btn-danger" onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No recurring plans</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecurringList;
