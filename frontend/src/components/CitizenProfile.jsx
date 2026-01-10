import { useState } from "react";
import "./CitizenProfile.css";

export default function CitizenProfile({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const maskAadhaar = () => {
    // Generate masked Aadhaar-style ID
    const last4 = user?.email?.slice(-4) || "1234";
    return `XXXX-XXXX-${last4}`;
  };

  const getInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : parts[0][0];
  };

  return (
    <div className="citizen-profile-wrapper">
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Profile"
      >
        <div className="profile-avatar">
          {getInitials().toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-name">{user?.name || "Citizen"}</div>
          <div className="profile-role">
            <span className="status-badge verified">✓ Verified</span>
          </div>
        </div>
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="profile-overlay" onClick={() => setIsOpen(false)} />
          <div className="profile-dropdown">
            <div className="profile-header-card">
              <div className="profile-avatar-large">
                {getInitials().toUpperCase()}
              </div>
              <div className="profile-details">
                <h3>{user?.name || "Citizen User"}</h3>
                <p className="citizen-id">Citizen ID: {maskAadhaar()}</p>
                <span className="status-badge verified">✓ Verified Account</span>
              </div>
            </div>

            <div className="profile-info-section">
              <div className="info-row">
                <span className="info-label">📧 Email</span>
                <span className="info-value">{user?.email || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">📱 Mobile</span>
                <span className="info-value">{user?.phone || "Not provided"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">📍 Address</span>
                <span className="info-value">{user?.address || "Not provided"}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-action-btn view" onClick={() => alert("Profile view coming soon")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  <path fillRule="evenodd" d="M1.38 8.28a.87.87 0 010-.566 7.003 7.003 0 0113.238.006.87.87 0 010 .566A7.003 7.003 0 011.379 8.28zM11 8a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View Profile
              </button>
              <button className="profile-action-btn edit" onClick={() => alert("Edit profile coming soon")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5z" />
                </svg>
                Edit Profile
              </button>
            </div>

            <div className="profile-footer">
              <button className="logout-btn" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z" />
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
