import { useEffect } from "react";
import "./SubmissionModal.css";

export default function SubmissionModal({ isOpen, onClose, complaintData }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const complaintId = complaintData?._id?.slice(-8).toUpperCase() || "XXXXXXXX";
  const submittedAt = new Date();

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="submission-modal">
        <div className="modal-icon success">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#059669" fillOpacity="0.1" />
            <path
              d="M26 32L30 36L38 28"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="modal-title">Complaint Submitted Successfully</h2>
        <p className="modal-subtitle">
          Your violation report has been registered with the authorities
        </p>

        <div className="complaint-details">
          <div className="detail-row">
            <span className="detail-label">Complaint ID</span>
            <span className="detail-value complaint-id">PVMS-{complaintId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Submitted On</span>
            <span className="detail-value">
              {submittedAt.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric"
              })}
              {" at "}
              {submittedAt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Violation Type</span>
            <span className="detail-value">{complaintData?.violationType || "—"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Assigned Department</span>
            <span className="detail-value">Municipal Enforcement Wing</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Expected Response</span>
            <span className="detail-value response-time">Within 7 working days</span>
          </div>
        </div>

        <div className="info-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            />
          </svg>
          <div>
            <strong>What happens next?</strong>
            <p>
              Your complaint will be reviewed by the enforcement officer. You will receive status updates
              via email/SMS. Track your complaint in the "My Complaints" section.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            View My Complaints
          </button>
          <button className="btn-primary" onClick={onClose}>
            Submit Another Report
          </button>
        </div>

        <div className="modal-footer">
          <small>
            🔒 All submissions are encrypted and securely stored • Government of India Initiative
          </small>
        </div>
      </div>
    </>
  );
}
