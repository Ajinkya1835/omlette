// frontend/src/pages/Owner.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./Owner.css";

function Owner() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [objectModal, setObjectModal] = useState(null);
  const [objectReason, setObjectReason] = useState("");

  const fetchViolations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/owner/violations");
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

  const handleAccept = async (id) => {
    if (!window.confirm("Accept this violation decision?")) return;

    try {
      await apiRequest(`/api/owner/violations/${id}/accept`, {
        method: "POST",
      });
      setMessage("Violation accepted successfully");
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to accept violation");
    }
  };

  const handleObject = async (id) => {
    if (!objectReason.trim()) {
      alert("Please provide a reason for objection");
      return;
    }

    try {
      await apiRequest(`/api/owner/violations/${id}/object`, {
        method: "POST",
        body: JSON.stringify({ reason: objectReason }),
      });
      setMessage("Objection submitted successfully");
      setObjectModal(null);
      setObjectReason("");
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit objection");
    }
  };

  return (
    <div className="owner-container">
      <div className="owner-header">
        <h1>Permit Holder Dashboard</h1>
        <p className="owner-subtitle">Review violations pending your response</p>
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
          <p>Loading pending violations...</p>
        </div>
      ) : violations.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Violations</h3>
          <p>You have no violations awaiting your response.</p>
        </div>
      ) : (
        <div className="violations-table-wrapper">
          <table className="violations-table">
            <thead>
              <tr>
                <th>Date Reported</th>
                <th>Reported By</th>
                <th>Violation Code</th>
                <th>Rule Details</th>
                <th>Decision</th>
                <th>Amount</th>
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
                  <td className="rule-details">
                    {v.decision?.ruleSnapshot ? (
                      <div>
                        <div className="rule-title">{v.decision.ruleSnapshot.title}</div>
                        <div className="rule-meta">
                          <span className="rule-act">{v.decision.ruleSnapshot.act}</span>
                          {v.decision.ruleSnapshot.section && (
                            <span> - Section {v.decision.ruleSnapshot.section}</span>
                          )}
                        </div>
                        <div className="rule-authority">
                          Authority: {v.decision.ruleSnapshot.authority}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted">No rule data</span>
                    )}
                  </td>
                  <td className="decision-cell">
                    <span className={`decision-badge decision-${v.decision?.decision?.toLowerCase()}`}>
                      {v.decision?.decision || "N/A"}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {v.decision?.amount ? (
                      <strong>₹{v.decision.amount}</strong>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleAccept(v._id)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-object"
                      onClick={() => setObjectModal(v._id)}
                    >
                      Object
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {objectModal && (
        <div className="modal-overlay" onClick={() => setObjectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Object to Violation</h3>
            <p>Provide a detailed reason for objecting to this violation:</p>
            <textarea
              className="object-textarea"
              rows="6"
              value={objectReason}
              onChange={(e) => setObjectReason(e.target.value)}
              placeholder="Enter your objection reason..."
            />
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => {
                  setObjectModal(null);
                  setObjectReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-submit"
                onClick={() => handleObject(objectModal)}
              >
                Submit Objection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Owner;