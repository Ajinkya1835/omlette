// frontend/src/pages/OwnerProfile.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./OwnerProfile.css";

function OwnerProfile({ onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/owner/profile");
      setProfile(data);
      setFormData({ name: data.name, email: data.email });
    } catch (err) {
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/owner/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      setProfile(data.user);
      setMessage("Profile updated successfully");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({ name: profile.name, email: profile.email });
    setIsEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="owner-profile">
        <div className="loading-state">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="owner-profile">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="page-subtitle">View and manage your account information</p>
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

      <div className="profile-card">
        <div className="profile-card-header">
          <h2>Personal Details</h2>
          {!isEditing && (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{profile?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">{profile?.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Role</span>
              <span className="detail-value">{profile?.role}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account Created</span>
              <span className="detail-value">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default OwnerProfile;
