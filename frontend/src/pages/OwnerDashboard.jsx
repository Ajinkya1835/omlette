// frontend/src/pages/OwnerDashboard.jsx
import { useEffect, useState } from "react";
import apiRequest from "../api/api.js";
import "./OwnerDashboard.css";

function OwnerDashboard({ onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileData, propertiesData, violationsData] = await Promise.all([
        apiRequest("/api/owner/profile"),
        apiRequest("/api/owner/properties"),
        apiRequest("/api/owner/violations"),
      ]);

      setProfile(profileData);
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      setViolations(Array.isArray(violationsData) ? violationsData : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  const pendingViolations = violations.filter((v) => v.status === "AWAITING_OWNER");
  const activeProperties = properties.filter((p) => p.status === "ACTIVE");
  const totalFines = violations
    .filter((v) => v.decision?.decision === "FINE" && v.status === "AWAITING_OWNER")
    .reduce((sum, v) => sum + (v.decision?.amount || 0), 0);

  return (
    <div className="owner-dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome, {profile?.name || "User"}</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card stat-blue">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <div className="stat-value">{properties.length}</div>
            <div className="stat-label">Total Properties</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <div className="stat-value">{activeProperties.length}</div>
            <div className="stat-label">Active Permits</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-value">{pendingViolations.length}</div>
            <div className="stat-label">Pending Actions</div>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon">₹</div>
          <div className="stat-info">
            <div className="stat-value">₹{totalFines.toLocaleString('en-IN')}</div>
            <div className="stat-label">Pending Payments</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="section-content">
            <button className="action-btn" onClick={() => onNavigate("profile")}>
              View Profile
            </button>
            <button className="action-btn" onClick={() => onNavigate("properties")}>
              Manage Properties
            </button>
            <button className="action-btn action-btn-primary" onClick={() => onNavigate("violations")}>
              View Violations
            </button>
          </div>
        </div>

        {profile && (
          <div className="section-card">
            <div className="section-header">
              <h2>Profile Information</h2>
            </div>
            <div className="section-content">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{profile.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{profile.role}</span>
              </div>
            </div>
          </div>
        )}

        {pendingViolations.length > 0 && (
          <div className="section-card section-card-warning">
            <div className="section-header">
              <h2>⚠️ Pending Actions Required</h2>
            </div>
            <div className="section-content">
              <p className="warning-text">
                You have {pendingViolations.length} violation(s) awaiting your response.
              </p>
              <button className="action-btn action-btn-warning" onClick={() => onNavigate("violations")}>
                Review Violations
              </button>
            </div>
          </div>
        )}

        {properties.length === 0 && (
          <div className="section-card section-card-info">
            <div className="section-header">
              <h2>Get Started</h2>
            </div>
            <div className="section-content">
              <p className="info-text">
                You haven't registered any properties yet. Add your first property to get started.
              </p>
              <button className="action-btn action-btn-primary" onClick={() => onNavigate("properties")}>
                Add Property
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
