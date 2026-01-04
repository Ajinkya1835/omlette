// frontend/src/components/StatusBadge.jsx
import "./StatusBadge.css";

function StatusBadge({ status }) {
  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "REPORTED":
        return "status-reported";
      case "AUTO_DECIDED":
        return "status-auto-decided";
      case "AWAITING_OWNER":
        return "status-awaiting";
      case "PAID":
        return "status-paid";
      case "OBJECTED":
        return "status-objected";
      case "UNDER_REVIEW":
        return "status-review";
      case "CLOSED":
        return "status-closed";
      case "ACTIVE":
        return "status-active";
      case "SUSPENDED":
        return "status-suspended";
      case "EXPIRED":
        return "status-expired";
      case "PENDING_APPROVAL":
        return "status-pending";
      case "APPROVED":
        return "status-approved";
      case "REJECTED":
        return "status-rejected";
      default:
        return "status-default";
    }
  };

  const getStatusLabel = (status) => {
    return status?.replace(/_/g, " ") || "Unknown";
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export default StatusBadge;
