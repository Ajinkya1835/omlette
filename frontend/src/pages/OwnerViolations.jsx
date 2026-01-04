// frontend/src/pages/OwnerViolations.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./OwnerViolations.css";

function OwnerViolations({ onNavigate }) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [objectModal, setObjectModal] = useState(null);
  const [objectReason, setObjectReason] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");

  useEffect(() => {
    fetchViolations();
  }, []);

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

  const handlePayment = async (violation) => {
    setPaymentModal(violation);
  };

  const processPayment = async () => {
    try {
      await apiRequest(`/api/owner/violations/${paymentModal._id}/accept`, {
        method: "POST",
      });
      setMessage("Payment successful. Receipt will be sent to your email.");
      setPaymentModal(null);
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to process payment");
    }
  };

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

  const handleObject = async () => {
    if (!objectReason.trim()) {
      alert("Please provide a reason for objection");
      return;
    }

    try {
      await apiRequest(`/api/owner/violations/${objectModal}/object`, {
        method: "POST",
        body: JSON.stringify({ reason: objectReason }),
      });
      setMessage("Objection submitted successfully. Your case will be reviewed by an officer.");
      setObjectModal(null);
      setObjectReason("");
      fetchViolations();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit objection");
    }
  };

  const getMediaUrl = (mediaUrl) => {
    if (mediaUrl.startsWith("http")) {
      return mediaUrl;
    }
    return `http://localhost:5000/${mediaUrl}`;
  };

  return (
    <div className="owner-violations">
      <div className="page-header">
        <h1>My Violations</h1>
        <p className="page-subtitle">Review and respond to violations against your properties</p>
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
        <div className="loading-state">Loading violations...</div>
      ) : violations.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Violations</h3>
          <p>You have no violations awaiting your response.</p>
        </div>
      ) : (
        <div className="violations-list">
          {violations.map((violation) => (
            <div key={violation._id} className="violation-card">
              <div className="violation-header">
                <div className="violation-title">
                  <h3>Violation #{violation._id.slice(-6)}</h3>
                  <span className="violation-code">{violation.violationType}</span>
                </div>
                <span className="violation-date">
                  {new Date(violation.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="violation-content">
                {/* Reporter Info */}
                <div className="info-section">
                  <h4>Reported By</h4>
                  <div className="info-details">
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{violation.reportedBy?.name || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{violation.reportedBy?.email || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {violation.description && (
                  <div className="info-section">
                    <h4>Description</h4>
                    <p className="description-text">{violation.description}</p>
                  </div>
                )}

                {/* Location */}
                <div className="info-section">
                  <h4>Location</h4>
                  <div className="info-details">
                    <div className="info-row">
                      <span className="info-label">Coordinates:</span>
                      <span className="info-value">
                        {violation.location?.latitude?.toFixed(6)}, {violation.location?.longitude?.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media Evidence */}
                {violation.media && violation.media.length > 0 && (
                  <div className="info-section">
                    <h4>Evidence ({violation.media.length})</h4>
                    <div className="media-grid">
                      {violation.media.map((media, index) => (
                        <div
                          key={index}
                          className="media-thumbnail"
                          onClick={() => setSelectedMedia(media)}
                        >
                          {media.type === "IMAGE" ? (
                            <img
                              src={getMediaUrl(media.url)}
                              alt={`Evidence ${index + 1}`}
                              className="thumbnail-img"
                            />
                          ) : (
                            <div className="video-thumbnail">
                              <video
                                src={getMediaUrl(media.url)}
                                className="thumbnail-video"
                              />
                              <div className="play-icon">▶</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rule Details */}
                {violation.decision?.ruleSnapshot && (
                  <div className="info-section rule-section">
                    <h4>Applied Rule</h4>
                    <div className="rule-details">
                      <div className="rule-title">{violation.decision.ruleSnapshot.title}</div>
                      <div className="rule-meta">
                        <div className="rule-item">
                          <span className="rule-label">Act:</span>
                          <span className="rule-value">{violation.decision.ruleSnapshot.act}</span>
                        </div>
                        {violation.decision.ruleSnapshot.section && (
                          <div className="rule-item">
                            <span className="rule-label">Section:</span>
                            <span className="rule-value">{violation.decision.ruleSnapshot.section}</span>
                          </div>
                        )}
                        <div className="rule-item">
                          <span className="rule-label">Authority:</span>
                          <span className="rule-value">{violation.decision.ruleSnapshot.authority}</span>
                        </div>
                        {violation.decision.ruleSnapshot.severity && (
                          <div className="rule-item">
                            <span className="rule-label">Severity:</span>
                            <span className={`severity-badge severity-${violation.decision.ruleSnapshot.severity.toLowerCase()}`}>
                              {violation.decision.ruleSnapshot.severity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Decision */}
                {violation.decision && (
                  <div className="info-section decision-section">
                    <h4>Automated Decision</h4>
                    <div className="decision-details">
                      <div className="decision-row">
                        <span className="decision-label">Decision Type:</span>
                        <span className={`decision-badge decision-${violation.decision.decision?.toLowerCase()}`}>
                          {violation.decision.decision || "N/A"}
                        </span>
                      </div>
                      {violation.decision.amount > 0 && (
                        <div className="decision-row">
                          <span className="decision-label">Fine Amount:</span>
                          <span className="amount-value">₹{violation.decision.amount}</span>
                        </div>
                      )}
                      {violation.decision.aiConfidence !== undefined && (
                        <div className="decision-row">
                          <span className="decision-label">AI Confidence:</span>
                          <span className="confidence-value">
                            {(violation.decision.aiConfidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="violation-actions">
                {violation.decision?.decision === "FINE" ? (
                  <button
                    className="btn btn-pay"
                    onClick={() => handlePayment(violation)}
                  >
                    💳 Pay Fine ₹{violation.decision.amount}
                  </button>
                ) : (
                  <button
                    className="btn btn-accept"
                    onClick={() => handleAccept(violation._id)}
                  >
                    Accept Decision
                  </button>
                )}
                <button
                  className="btn btn-object"
                  onClick={() => setObjectModal(violation._id)}
                >
                  Object / Appeal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <div className="media-modal" onClick={() => setSelectedMedia(null)}>
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMedia(null)}>
              ✕
            </button>
            {selectedMedia.type === "IMAGE" ? (
              <img
                src={getMediaUrl(selectedMedia.url)}
                alt="Evidence"
                className="modal-media"
              />
            ) : (
              <video
                src={getMediaUrl(selectedMedia.url)}
                controls
                className="modal-media"
              />
            )}
          </div>
        </div>
      )}

      {/* Objection Modal */}
      {objectModal && (
        <div className="objection-modal" onClick={() => setObjectModal(null)}>
          <div className="objection-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Objection / Appeal</h3>
            <p>Provide a detailed reason for objecting to this violation decision:</p>
            <textarea
              className="objection-textarea"
              rows="6"
              value={objectReason}
              onChange={(e) => setObjectReason(e.target.value)}
              placeholder="Enter your objection reason in detail..."
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
              <button className="btn btn-submit" onClick={handleObject}>
                Submit Objection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="payment-modal" onClick={() => setPaymentModal(null)}>
          <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="payment-header">
              <h3>🏛️ Municipal Corporation Payment Gateway</h3>
              <p>Government of India - Official Payment Portal</p>
            </div>
            
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Violation ID:</span>
                <span className="payment-value">#{paymentModal._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Violation Type:</span>
                <span className="payment-value">{paymentModal.violationType}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Decision:</span>
                <span className="payment-value">{paymentModal.decision?.decision}</span>
              </div>
              <div className="payment-row payment-amount">
                <span className="payment-label">Amount Payable:</span>
                <span className="payment-value">₹{paymentModal.decision?.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="payment-method">
              <h4>Select Payment Method</h4>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>UPI / BHIM</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="netbanking"
                    checked={paymentMethod === "netbanking"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Net Banking</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Debit / Credit Card</span>
                </label>
              </div>
            </div>

            <div className="payment-disclaimer">
              <p>⚠️ This is a MOCK payment gateway for demonstration purposes only.</p>
              <p>No actual payment will be processed.</p>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setPaymentModal(null)}
              >
                Cancel
              </button>
              <button className="btn btn-pay-now" onClick={processPayment}>
                Proceed to Pay ₹{paymentModal.decision?.amount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerViolations;
