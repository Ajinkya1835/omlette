import { useState } from "react";
import "./ComplaintsTable.css";

export default function ComplaintsTable({ violations, loading }) {
  const [expandedId, setExpandedId] = useState(null);

  const getStatusConfig = (status) => {
    const configs = {
      "AWAITING_OWNER": { label: "Under Review", color: "#d97706", bgColor: "#fef9e7" },
      "PAID": { label: "Resolved", color: "#059669", bgColor: "#ecfdf5" },
      "OBJECTED": { label: "Objected", color: "#dc2626", bgColor: "#fef2f2" },
      "CLOSED": { label: "Closed", color: "#6b7280", bgColor: "#f3f4f6" },
      "UNDER_REVIEW": { label: "In Progress", color: "#0891b2", bgColor: "#ecfeff" },
      "REPORTED": { label: "Submitted", color: "#7c3aed", bgColor: "#faf5ff" }
    };
    return configs[status] || { label: status, color: "#6b7280", bgColor: "#f3f4f6" };
  };

  const getTimeline = (violation) => {
    const timeline = [
      {
        label: "Submitted",
        date: violation.createdAt,
        icon: "📝",
        completed: true
      },
      {
        label: "Under Review",
        date: violation.createdAt,
        icon: "🔍",
        completed: ["AWAITING_OWNER", "OBJECTED", "UNDER_REVIEW", "PAID", "CLOSED"].includes(violation.status)
      },
      {
        label: "Action Taken",
        date: violation.updatedAt,
        icon: violation.status === "OBJECTED" ? "⚠️" : "✅",
        completed: ["PAID", "CLOSED", "OBJECTED"].includes(violation.status)
      }
    ];
    return timeline;
  };

  if (loading) {
    return (
      <div className="complaints-loading">
        <div className="spinner"></div>
        <p>Loading your complaints...</p>
      </div>
    );
  }

  if (violations.length === 0) {
    return (
      <div className="complaints-empty">
        <div className="empty-icon">📭</div>
        <h3>No Complaints Submitted</h3>
        <p>Your reported violations will appear here with tracking information</p>
      </div>
    );
  }

  return (
    <div className="complaints-table-wrapper">
      <table className="complaints-table">
        <thead>
          <tr>
            <th>Complaint ID</th>
            <th>Date Submitted</th>
            <th>Violation Type</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((v) => {
            const isExpanded = expandedId === v._id;
            const complaintId = `PVMS-${v._id.slice(-8).toUpperCase()}`;
            const statusConfig = getStatusConfig(v.status);

            return (
              <>
                <tr key={v._id} className={isExpanded ? "expanded" : ""}>
                  <td>
                    <div className="complaint-id-cell">
                      <span className="id-badge">{complaintId}</span>
                    </div>
                  </td>
                  <td>
                    {new Date(v.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                    <div className="time-text">
                      {new Date(v.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="violation-type">
                      {v.violationType}
                    </div>
                  </td>
                  <td>
                    <span className="department-tag">
                      Municipal Enforcement
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        background: statusConfig.bgColor,
                        color: statusConfig.color
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => setExpandedId(isExpanded ? null : v._id)}
                    >
                      {isExpanded ? "Hide Details" : "View Timeline"}
                    </button>
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr className="timeline-row">
                    <td colSpan="6">
                      <div className="timeline-container">
                        <h4>Complaint Timeline</h4>
                        <div className="timeline">
                          {getTimeline(v).map((item, idx) => (
                            <div key={idx} className={`timeline-item ${item.completed ? "completed" : "pending"}`}>
                              <div className="timeline-icon">{item.icon}</div>
                              <div className="timeline-content">
                                <div className="timeline-label">{item.label}</div>
                                {item.date && item.completed && (
                                  <div className="timeline-date">
                                    {new Date(item.date).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {v.description && (
                          <div className="complaint-description">
                            <strong>Description:</strong>
                            <p>{v.description}</p>
                          </div>
                        )}

                        {v.relatedProperty && (
                          <div className="related-property">
                            <strong>Related Property:</strong>
                            <p>{v.relatedProperty.propertyName} ({v.relatedProperty.propertyType})</p>
                          </div>
                        )}

                        {v.media && v.media.length > 0 && (
                          <div className="evidence-section">
                            <strong>Evidence Submitted:</strong>
                            <div className="evidence-count">
                              📎 {v.media.length} file(s) attached
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
