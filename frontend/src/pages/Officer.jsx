import { useState, useEffect } from "react";
import apiRequest from "../api/api.js";
import Layout from "../components/Layout.jsx";
import "./Officer.css";

export default function Officer() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState({
    pending: { citizens: 0, owners: 0, properties: 0 },
    approved: { citizens: 0, owners: 0 },
  });
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedForAction, setSelectedForAction] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, citizensData, ownersData, propsData] = await Promise.all([
        apiRequest("/api/officer/dashboard-stats"),
        apiRequest("/api/officer/pending-citizens"),
        apiRequest("/api/officer/pending-owners"),
        apiRequest("/api/officer/pending-properties"),
      ]);

      setStats(statsData);
      setPendingCitizens(citizensData.citizens || []);
      setPendingOwners(ownersData.owners || []);
      setPendingProperties(propsData.properties || []);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCitizen = async (userId) => {
    try {
      const response = await apiRequest(`/api/officer/approve-citizen/${userId}`, {
        method: "POST",
      });

      setPendingCitizens((prev) => prev.filter((c) => c._id !== userId));
      setStats((prev) => ({
        ...prev,
        pending: { ...prev.pending, citizens: prev.pending.citizens - 1 },
        approved: { ...prev.approved, citizens: prev.approved.citizens + 1 },
      }));
      setSelectedForAction(null);
    } catch (err) {
      setError("Failed to approve citizen");
    }
  };

  const handleApproveOwner = async (userId) => {
    try {
      const response = await apiRequest(`/api/officer/approve-owner/${userId}`, {
        method: "POST",
      });

      setPendingOwners((prev) => prev.filter((o) => o._id !== userId));
      setStats((prev) => ({
        ...prev,
        pending: { ...prev.pending, owners: prev.pending.owners - 1 },
        approved: { ...prev.approved, owners: prev.approved.owners + 1 },
      }));
      setSelectedForAction(null);
    } catch (err) {
      setError("Failed to approve owner");
    }
  };

  const handleRejectUser = async (userId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      const response = await apiRequest(`/api/officer/reject-user/${userId}`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason }),
      });

      setPendingCitizens((prev) => prev.filter((c) => c._id !== userId));
      setPendingOwners((prev) => prev.filter((o) => o._id !== userId));
      setSelectedForAction(null);
      setRejectionReason("");
    } catch (err) {
      setError("Failed to reject user");
    }
  };

  const handleApproveProperty = async (propertyId) => {
    try {
      const response = await apiRequest(`/api/officer/approve-property/${propertyId}`, {
        method: "POST",
      });

      setPendingProperties((prev) => prev.filter((p) => p._id !== propertyId));
      setStats((prev) => ({
        ...prev,
        pending: { ...prev.pending, properties: prev.pending.properties - 1 },
      }));
      setSelectedForAction(null);
    } catch (err) {
      setError("Failed to approve property");
    }
  };

  const handleRejectProperty = async (propertyId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      const response = await apiRequest(`/api/officer/reject-property/${propertyId}`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason }),
      });

      setPendingProperties((prev) => prev.filter((p) => p._id !== propertyId));
      setStats((prev) => ({
        ...prev,
        pending: { ...prev.pending, properties: prev.pending.properties - 1 },
      }));
      setSelectedForAction(null);
      setRejectionReason("");
    } catch (err) {
      setError("Failed to reject property");
    }
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <h2>Officer Control Panel</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.pending.citizens}</div>
          <div className="stat-label">Pending Citizens</div>
          <button
            className="stat-btn"
            onClick={() => setCurrentTab("citizens")}
          >
            Review
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.pending.owners}</div>
          <div className="stat-label">Pending Owners</div>
          <button
            className="stat-btn"
            onClick={() => setCurrentTab("owners")}
          >
            Review
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.pending.properties}</div>
          <div className="stat-label">Pending Properties</div>
          <button
            className="stat-btn"
            onClick={() => setCurrentTab("properties")}
          >
            Review
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.total.citizens}</div>
          <div className="stat-label">Total Citizens</div>
        </div>

        <div className="stat-card">
          <div className="stat-number">{stats.total.owners}</div>
          <div className="stat-label">Total Owners</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <button className="btn btn-secondary" onClick={() => setCurrentTab("violations")}>
          View Objected Violations ({stats.violations || 0})
        </button>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          Refresh All Data
        </button>
      </div>
    </div>
  );

  const renderCitizens = () => (
    <div className="approval-tab">
      <h2>Pending Citizen Registrations</h2>
      
      {pendingCitizens.length === 0 ? (
        <div className="empty-state">
          <p>No pending citizen registrations</p>
        </div>
      ) : (
        <div className="approval-list">
          {pendingCitizens.map((citizen) => (
            <div key={citizen._id} className="approval-item">
              <div className="item-content">
                <h3>{citizen.name}</h3>
                <p>Email: {citizen.email}</p>
                <p>Phone: {citizen.phone}</p>
                <p>Status: Pending Approval</p>
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleApproveCitizen(citizen._id)}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setSelectedForAction(citizen._id);
                    setActionType("reject-citizen");
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOwners = () => (
    <div className="approval-tab">
      <h2>Pending Owner/Permit Holder Registrations</h2>
      
      {pendingOwners.length === 0 ? (
        <div className="empty-state">
          <p>No pending owner registrations</p>
        </div>
      ) : (
        <div className="approval-list">
          {pendingOwners.map((owner) => (
            <div key={owner._id} className="approval-item">
              <div className="item-content">
                <h3>{owner.name}</h3>
                <p>Email: {owner.email}</p>
                <p>Phone: {owner.phone}</p>
                <p>Address: {owner.address || "Not provided"}</p>
                <p>Status: Pending Approval</p>
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleApproveOwner(owner._id)}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setSelectedForAction(owner._id);
                    setActionType("reject-owner");
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProperties = () => (
    <div className="approval-tab">
      <h2>Pending Property Approvals</h2>
      
      {pendingProperties.length === 0 ? (
        <div className="empty-state">
          <p>No pending property approvals</p>
        </div>
      ) : (
        <div className="approval-list">
          {pendingProperties.map((property) => (
            <div key={property._id} className="approval-item">
              <div className="item-content">
                <h3>{property.propertyName}</h3>
                <p>Owner: {property.owner?.name || "Unknown"}</p>
                <p>Type: {property.propertyType}</p>
                <p>Address: {property.address}</p>
                <p>Ward: {property.wardNumber}</p>
                <p>Status: Pending Approval</p>
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleApproveProperty(property._id)}
                >
                  ✓ Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setSelectedForAction(property._id);
                    setActionType("reject-property");
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRejectionModal = () => (
    <div className="modal-overlay" onClick={() => setSelectedForAction(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Provide Rejection Reason</h3>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter reason for rejection..."
          rows={4}
        />
        <div className="modal-actions">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (actionType === "reject-citizen") {
                handleRejectUser(selectedForAction);
              } else if (actionType === "reject-owner") {
                handleRejectUser(selectedForAction);
              } else if (actionType === "reject-property") {
                handleRejectProperty(selectedForAction);
              }
            }}
          >
            Confirm Rejection
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSelectedForAction(null);
              setRejectionReason("");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="officer-container">
        <div className="officer-nav">
          <button
            className={`nav-btn ${currentTab === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${currentTab === "citizens" ? "active" : ""}`}
            onClick={() => setCurrentTab("citizens")}
          >
            Citizens ({pendingCitizens.length})
          </button>
          <button
            className={`nav-btn ${currentTab === "owners" ? "active" : ""}`}
            onClick={() => setCurrentTab("owners")}
          >
            Owners ({pendingOwners.length})
          </button>
          <button
            className={`nav-btn ${currentTab === "properties" ? "active" : ""}`}
            onClick={() => setCurrentTab("properties")}
          >
            Properties ({pendingProperties.length})
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {currentTab === "dashboard" && renderDashboard()}
            {currentTab === "citizens" && renderCitizens()}
            {currentTab === "owners" && renderOwners()}
            {currentTab === "properties" && renderProperties()}
          </>
        )}

        {selectedForAction && renderRejectionModal()}
      </div>
    </Layout>
  );
}