import { useState, useEffect, useRef } from "react";
import apiRequest from "../api/api.js";
import Layout from "../components/Layout.jsx";
import MapSearchPanel from "../components/MapSearchPanel.jsx";
import { loadGoogleMaps } from "../utils/googleMapsLoader.js";
import "./Officer.css";

export default function Officer({ onLogout }) {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [stats, setStats] = useState({
    pending: { citizens: 0, owners: 0, properties: 0 },
    approved: { citizens: 0, owners: 0 },
    total: { citizens: 0, owners: 0 },
    violations: 0,
  });
  const [pendingCitizens, setPendingCitizens] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [objectedViolations, setObjectedViolations] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterMarkersRef = useRef([]);
  const [selectedClusterKey, setSelectedClusterKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedForAction, setSelectedForAction] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (currentTab === "violations") {
      fetchObjectedViolations();
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== "violations") return;
    if (!objectedViolations || objectedViolations.length === 0) {
      clearClusterMarkers();
      return;
    }
    renderViolationMap(objectedViolations);
  }, [currentTab, objectedViolations]);

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

  const fetchObjectedViolations = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/officer/violations");
      const list = data.violations || [];
      setObjectedViolations(list);
      setStats((prev) => ({ ...prev, violations: list.length }));
    } catch (err) {
      setError("Failed to load objected violations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearClusterMarkers = () => {
    clusterMarkersRef.current.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    clusterMarkersRef.current = [];
  };

  const buildClusters = (list) => {
    const buckets = new Map();
    list.forEach((v) => {
      const lat = parseFloat(v.location?.latitude);
      const lng = parseFloat(v.location?.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const key = `${lat.toFixed(2)}_${lng.toFixed(2)}`; // coarse bucket for clustering
      if (!buckets.has(key)) {
        buckets.set(key, { key, latSum: 0, lngSum: 0, count: 0, items: [] });
      }
      const bucket = buckets.get(key);
      bucket.latSum += lat;
      bucket.lngSum += lng;
      bucket.count += 1;
      bucket.items.push(v);
    });

    return Array.from(buckets.values()).map((b) => ({
      key: b.key,
      lat: b.latSum / b.count,
      lng: b.lngSum / b.count,
      items: b.items,
    }));
  };

  const renderViolationMap = (list) => {
    loadGoogleMaps((error) => {
      if (error) {
        console.error("Google Maps loading error:", error);
        return;
      }
      if (!mapRef.current) return;

      const clusters = buildClusters(list);

      if (!mapInstanceRef.current) {
        const fallbackCenter = clusters[0]
          ? { lat: clusters[0].lat, lng: clusters[0].lng }
          : { lat: 19.076, lng: 72.8777 };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: fallbackCenter,
          zoom: clusters.length > 0 ? 11 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      clearClusterMarkers();

      if (clusters.length === 0) return;

      const bounds = new window.google.maps.LatLngBounds();

      clusters.forEach((cluster) => {
        const marker = new window.google.maps.Marker({
          position: { lat: cluster.lat, lng: cluster.lng },
          map: mapInstanceRef.current,
          label: `${cluster.items.length}`,
          title: `${cluster.items.length} violation${cluster.items.length > 1 ? "s" : ""}`,
        });

        marker.addListener("click", () => {
          setSelectedClusterKey(cluster.key);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat: cluster.lat, lng: cluster.lng });
          }
          const firstId = cluster.items[0]?._id;
          if (firstId) {
            const el = document.getElementById(`violation-${firstId}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });

        clusterMarkersRef.current.push(marker);
        bounds.extend({ lat: cluster.lat, lng: cluster.lng });
      });

      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds);
      }
    });
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
  const handleConfirmViolation = async (violationId) => {
    try {
      await apiRequest(`/api/officer/violations/${violationId}/confirm`, {
        method: "POST",
      });
      setObjectedViolations((prev) => prev.filter((v) => v._id !== violationId));
      setStats((prev) => ({
        ...prev,
        violations: Math.max(0, prev.violations - 1),
      }));
      setError("");
    } catch (err) {
      setError("Failed to confirm violation");
      console.error(err);
    }
  };

  const handleOverrideViolation = async (violationId) => {
    try {
      await apiRequest(`/api/officer/violations/${violationId}/override`, {
        method: "POST",
      });
      setObjectedViolations((prev) => prev.filter((v) => v._id !== violationId));
      setStats((prev) => ({
        ...prev,
        violations: Math.max(0, prev.violations - 1),
      }));
      setError("");
    } catch (err) {
      setError("Failed to override violation");
      console.error(err);
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

  const getClusterKey = (violation) => {
    const lat = parseFloat(violation.location?.latitude);
    const lng = parseFloat(violation.location?.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
  };

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

  const renderViolations = () => (
    <div className="section">
      <h2>Objected Violations</h2>
      <div className="violations-map-panel">
        <div className="violations-map" ref={mapRef}>
          {(!objectedViolations || objectedViolations.length === 0) && (
            <div className="map-placeholder">No coordinates available</div>
          )}
        </div>
        <div className="map-legend">
          <p><strong>Cluster size</strong> shows as marker label. Click a marker to jump to the list below.</p>
        </div>
      </div>
      {objectedViolations.length === 0 ? (
        <div className="empty-state">
          <p>No objected violations at this time</p>
        </div>
      ) : (
        <div className="items-list">
          {objectedViolations.map((violation) => (
            <div
              key={violation._id}
              id={`violation-${violation._id}`}
              className={`item-card ${selectedClusterKey && getClusterKey(violation) === selectedClusterKey ? "highlighted" : ""}`}
            >
              <div className="item-content">
                <h3>Violation #{violation._id.slice(-6)}</h3>
                <p><strong>Property:</strong> {violation.relatedProperty?.propertyName || "N/A"}</p>
                <p><strong>Owner:</strong> {violation.relatedProperty?.owner?.name || "N/A"}</p>
                <p><strong>Reported By:</strong> {violation.reportedBy?.name || "Anonymous"}</p>
                <p><strong>Violation Type:</strong> {violation.violationType}</p>
                <p><strong>Description:</strong> {violation.description}</p>
                <p><strong>Objection Reason:</strong> {violation.objectionReason || violation.decision?.overrideReason || "No reason provided"}</p>
                <p><strong>Fine Amount:</strong> ₹{violation.decision?.amount ?? 0}</p>
                <p><strong>Owner History:</strong> {violation.ownerHistory?.total || 0} total / {violation.ownerHistory?.unpaid || 0} open</p>
                <p><strong>Risk Score:</strong> {violation.ownerHistory?.riskScore ?? 0}</p>
                {violation.location?.latitude && violation.location?.longitude && (
                  <p>
                    <strong>Location:</strong> {violation.location.latitude}, {violation.location.longitude} (
                    <a
                      href={`https://www.google.com/maps?q=${violation.location.latitude},${violation.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Maps
                    </a>
                    )
                  </p>
                )}
                <p><strong>Status:</strong> <span className="status-badge status-objected">OBJECTED</span></p>
                {violation.media?.length > 0 && (
                  <div className="media-list">
                    <strong>Evidence:</strong>
                    <div className="media-previews">
                      {violation.media.map((m, idx) => (
                        <div key={idx} className="media-item">
                          {m.type === "VIDEO" ? (
                            <video
                              controls
                              preload="metadata"
                              width="220"
                              height="140"
                              poster={m.url}
                            >
                              <source src={m.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img src={m.url} alt={`Evidence ${idx + 1}`} loading="lazy" width="220" height="140" />
                          )}
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="media-link">
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="item-actions">
                <button
                  className="btn btn-success"
                  onClick={() => handleConfirmViolation(violation._id)}
                  title="Confirm violation - owner must pay"
                >
                  ✓ Confirm Violation
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleOverrideViolation(violation._id)}
                  title="Override objection - cancel violation"
                >
                  ✕ Override (Cancel)
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
    <Layout onLogout={onLogout}>
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
          <button
            className={`nav-btn ${currentTab === "violations" ? "active" : ""}`}
            onClick={() => setCurrentTab("violations")}
          >
            Objected Violations ({stats.violations || 0})
          </button>
          <button
            className={`nav-btn ${currentTab === "map" ? "active" : ""}`}
            onClick={() => setCurrentTab("map")}
          >
            🗺️ Map Search
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
            {currentTab === "violations" && renderViolations()}
            {currentTab === "map" && <MapSearchPanel userRole="OFFICER" />}
          </>
        )}

        {selectedForAction && renderRejectionModal()}
      </div>
    </Layout>
  );
}