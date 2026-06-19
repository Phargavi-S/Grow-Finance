import React, { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

const InvoiceList = ({ invoices, loading, onEdit, onDelete, onView }) => {
  const [updating, setUpdating] = useState(null);

  const updateStatus = async (id, status) => {
    try {
      setUpdating(id);

      await axios.put(
        `${API}/invoices/${id}/status`,
        { status },
        {
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const sendReminder = async (id) => {
    try {
      setUpdating(id);

      await axios.post(
        `${API}/invoices/${id}/send-reminder`,
        {},
        {
          withCredentials: true,
        }
      );

      alert("Reminder sent successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to send reminder");
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (value) => {
    return `€${Number(value || 0).toFixed(2)}`;
  };

  if (loading) return <div className="loading">Loading invoices...</div>;

  if (!invoices || invoices.length === 0)
    return (
      <div className="empty-state">
        No invoices yet. Create your first invoice!
      </div>
    );

  return (
    <div className="data-table-container" style={{ marginTop: "24px" }}>
      <h3 className="form-title">All Invoices</h3>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Tax (18%)</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id}>
              <td>
                {inv.date
                  ? new Date(inv.date).toLocaleDateString()
                  : "-"}
              </td>

              <td>
                {inv.invoiceNumber || "-"}

                {inv.recurringId && (
                  <span
                    style={{
                      marginLeft: 8,
                      padding: "2px 6px",
                      background: "#f0f9ff",
                      color: "#0369a1",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    Recurring
                  </span>
                )}
              </td>

              <td>{inv.customerId?.name || "N/A"}</td>

              <td>
                <span
                  className={`status-badge status-${(
                    inv.status || "UNPAID"
                  ).toLowerCase()}`}
                >
                  {inv.status || "UNPAID"}
                </span>
              </td>

              <td>
                {inv.dueDate
                  ? new Date(inv.dueDate).toLocaleDateString()
                  : "-"}
              </td>

              <td>{formatCurrency(inv.tax)}</td>

              <td>{formatCurrency(inv.total)}</td>

              <td style={{ whiteSpace: "nowrap" }}>
                <button
                  className="btn-secondary"
                  onClick={() => onEdit(inv)}
                  style={{ marginRight: "6px" }}
                >
                  Edit
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => onDelete(inv._id)}
                  style={{ marginRight: "6px" }}
                >
                  Delete
                </button>

                {inv.status === "UNPAID" && (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        updateStatus(inv._id, "PAID")
                      }
                      disabled={updating === inv._id}
                      style={{ marginRight: "6px" }}
                    >
                      Mark Paid
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => sendReminder(inv._id)}
                      disabled={updating === inv._id}
                      style={{ marginRight: "6px" }}
                    >
                      {updating === inv._id
                        ? "Sending..."
                        : "Reminder"}
                    </button>
                  </>
                )}

                <button
                  className="btn-secondary"
                  onClick={() => onView(inv._id)}
                >
                  Preview
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;