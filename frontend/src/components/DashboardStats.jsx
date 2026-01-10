import "./DashboardStats.css";

export default function DashboardStats({ violations }) {
  const totalReports = violations.length;
  
  const underReview = violations.filter(
    v => v.status === "AWAITING_OWNER" || v.status === "OBJECTED" || v.status === "UNDER_REVIEW"
  ).length;
  
  const resolved = violations.filter(
    v => v.status === "CLOSED" || v.status === "PAID"
  ).length;
  
  const lastReport = violations.length > 0 
    ? violations[0] 
    : null;

  const getStatusLabel = (status) => {
    const statusMap = {
      "AWAITING_OWNER": "Under Review",
      "OBJECTED": "Objected",
      "UNDER_REVIEW": "Under Review",
      "CLOSED": "Closed",
      "PAID": "Resolved",
      "REPORTED": "Submitted"
    };
    return statusMap[status] || status;
  };

  const stats = [
    {
      icon: "📊",
      label: "Total Reports",
      value: totalReports,
      color: "#2c5282",
      bgColor: "#eff6ff"
    },
    {
      icon: "⏳",
      label: "Under Review",
      value: underReview,
      color: "#d97706",
      bgColor: "#fef9e7"
    },
    {
      icon: "✅",
      label: "Resolved",
      value: resolved,
      color: "#059669",
      bgColor: "#ecfdf5"
    },
    {
      icon: "🕐",
      label: "Last Report",
      value: lastReport 
        ? new Date(lastReport.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
          })
        : "—",
      subtitle: lastReport ? getStatusLabel(lastReport.status) : "No reports yet",
      color: "#7c3aed",
      bgColor: "#faf5ff"
    }
  ];

  return (
    <div className="dashboard-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
          <div className="stat-icon" style={{ background: stat.bgColor }}>
            {stat.icon}
          </div>
          <div className="stat-content">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            {stat.subtitle && (
              <div className="stat-subtitle">{stat.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
