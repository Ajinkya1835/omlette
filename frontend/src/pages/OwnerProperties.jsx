// frontend/src/pages/OwnerProperties.jsx
import { useEffect, useState } from "react";
import apiRequest from "../api/api.js";
import "./OwnerProperties.css";

function OwnerProperties({ onNavigate }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "Shop",
    address: "",
    wardNumber: "",
    zone: "",
    latitude: "",
    longitude: "",
    permitNumber: "",
    permitValidFrom: "",
    permitValidTo: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/owner/properties");
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingProperty) {
        await apiRequest(`/api/owner/properties/${editingProperty._id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setMessage("Property updated successfully");
      } else {
        await apiRequest("/api/owner/properties", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setMessage("Property added successfully");
      }

      resetForm();
      fetchProperties();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save property");
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      propertyName: property.propertyName,
      propertyType: property.propertyType,
      address: property.address,
      wardNumber: property.wardNumber,
      zone: property.zone,
      latitude: property.latitude,
      longitude: property.longitude,
      permitNumber: property.permitNumber,
      permitValidFrom: property.permitValidFrom?.split("T")[0] || "",
      permitValidTo: property.permitValidTo?.split("T")[0] || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      propertyName: "",
      propertyType: "Shop",
      address: "",
      wardNumber: "",
      zone: "",
      latitude: "",
      longitude: "",
      permitNumber: "",
      permitValidFrom: "",
      permitValidTo: "",
    });
    setShowAddForm(false);
    setEditingProperty(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "status-active";
      case "SUSPENDED":
        return "status-suspended";
      case "EXPIRED":
        return "status-expired";
      default:
        return "";
    }
  };

  return (
    <div className="owner-properties">
      <div className="page-header">
        <h1>My Properties</h1>
        <p className="page-subtitle">Manage your registered properties and permits</p>
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

      {!showAddForm && (
        <div className="add-property-section">
          <button className="btn-add-property" onClick={() => setShowAddForm(true)}>
            + Add New Property
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="property-form-card">
          <div className="form-card-header">
            <h2>{editingProperty ? "Edit Property" : "Add New Property"}</h2>
            <button className="btn-close" onClick={resetForm}>
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="property-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyName">Property Name *</label>
                <input
                  type="text"
                  id="propertyName"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="propertyType">Property Type *</label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  required
                >
                  <option value="Shop">Shop</option>
                  <option value="Industry">Industry</option>
                  <option value="Residence">Residence</option>
                  <option value="Farm">Farm</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="wardNumber">Ward Number *</label>
                <input
                  type="text"
                  id="wardNumber"
                  value={formData.wardNumber}
                  onChange={(e) => setFormData({ ...formData, wardNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="zone">Zone *</label>
                <input
                  type="text"
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="permitNumber">Permit Number *</label>
              <input
                type="text"
                id="permitNumber"
                value={formData.permitNumber}
                onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                required
                disabled={editingProperty !== null}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="permitValidFrom">Permit Valid From *</label>
                <input
                  type="date"
                  id="permitValidFrom"
                  value={formData.permitValidFrom}
                  onChange={(e) => setFormData({ ...formData, permitValidFrom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="permitValidTo">Permit Valid To *</label>
                <input
                  type="date"
                  id="permitValidTo"
                  value={formData.permitValidTo}
                  onChange={(e) => setFormData({ ...formData, permitValidTo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {editingProperty ? "Update Property" : "Add Property"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <h3>No Properties Registered</h3>
          <p>Add your first property to get started.</p>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => (
            <div key={property._id} className="property-card">
              <div className="property-card-header">
                <h3>{property.propertyName}</h3>
                <span className={`status-badge ${getStatusBadgeClass(property.status)}`}>
                  {property.status}
                </span>
              </div>

              <div className="property-details">
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{property.propertyType}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Permit Number:</span>
                  <span className="detail-value">{property.permitNumber}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{property.address}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Ward:</span>
                  <span className="detail-value">{property.wardNumber}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Zone:</span>
                  <span className="detail-value">{property.zone}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Valid From:</span>
                  <span className="detail-value">
                    {new Date(property.permitValidFrom).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Valid To:</span>
                  <span className="detail-value">
                    {new Date(property.permitValidTo).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="property-actions">
                <button className="btn-edit-property" onClick={() => handleEdit(property)}>
                  Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OwnerProperties;
