// frontend/src/pages/Officer.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./Officer.css";

function Officer() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");

  const fetchViolations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/officer/violations");
      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch violations");
      setViolations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleConfirm = async (id) => {
    if (!window.confirm("Confirm this violation as valid?")) return;

    try {
      await apiRequest(`/api/officer/violations/${id}/confirm`, {
        method: "POST",
      });
      setMessage("Violation confirmed successfully");
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to confirm violation");
    }
  };

  const handleOverride = async (id) => {
    if (!overrideReason.trim()) {
      alert("Please provide a reason for override");
      return;
    }

    try {
      await apiRequest(`/api/officer/violations/${id}/override`, {
        method: "POST",
        body: JSON.stringify({ reason: overrideReason }),
      });
      setMessage("Violation overridden successfully");
      setOverrideModal(null);
      setOverrideReason("");
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to override violation");
    }
  };

  return (
    <div className="officer-container">
      <div className="officer-header">
        <h1>Officer Dashboard</h1>
        <p className="officer-subtitle">Review and resolve objected violations</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <strong>Success:</strong> {message}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Loading objected violations...</p>
        </div>
      ) : violations.length === 0 ? (
        <div className="empty-state">
          <h3>No Objected Violations</h3>
          <p>All cases have been resolved. Check back later.</p>
        </div>
      ) : (
        <div className="violations-table-wrapper">
          <table className="violations-table">
            <thead>
              <tr>
                <th>Date Reported</th>
                <th>Citizen Details</th>
                <th>Violation Code</th>
                <th>Description</th>
                <th>Decision Snapshot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v._id}>
                  <td className="date-cell">
                    {new Date(v.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="citizen-info">
                      <div className="citizen-name">{v.reportedBy?.name || "N/A"}</div>
                      <div className="citizen-email">{v.reportedBy?.email || "N/A"}</div>
                    </div>
                  </td>
                  <td className="code-cell">
                    <span className="violation-code">{v.violationType}</span>
                  </td>
                  <td className="desc-cell">{v.description || "No description provided"}</td>
                  <td>
                    {v.decision ? (
                      <div className="decision-snapshot">
                        <div>
                          <strong>Decision:</strong> {v.decision.decision || "N/A"}
                        </div>
                        <div>
                          <strong>Amount:</strong> ₹{v.decision.amount || 0}
                        </div>
                        {v.decision.ruleSnapshot && (
                          <div>
                            <strong>Rule:</strong> {v.decision.ruleSnapshot.title}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">No decision data</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-confirm"
                      onClick={() => handleConfirm(v._id)}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn btn-override"
                      onClick={() => setOverrideModal(v._id)}
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Override Violation</h3>
            <p>Provide a reason for overriding this violation decision:</p>
            <textarea
              className="override-textarea"
              rows="5"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter reason for override..."
            />
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => {
                  setOverrideModal(null);
                  setOverrideReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-submit"
                onClick={() => handleOverride(overrideModal)}
              >
                Submit Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Officer;