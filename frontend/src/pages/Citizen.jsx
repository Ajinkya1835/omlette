import { useEffect, useState } from "react";
import apiRequest, { apiUpload } from "../api/api.js";
import Layout from "../components/Layout.jsx";
import MapPicker from "../components/MapPicker.jsx";
import PropertyMapSelector from "../components/PropertyMapSelector.jsx";
import CitizenNearbyProperties from "./CitizenNearbyProperties.jsx";

function Citizen({ onLogout }) {
  /* ---------- RULE DATA ---------- */
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRuleCode, setSelectedRuleCode] = useState("");

  /* ---------- FORM ---------- */
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  /* ---------- LOCATION ---------- */
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Detecting location…");

  /* ---------- NEARBY PROPERTIES ---------- */
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  /* ---------- VIOLATIONS ---------- */
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- UI ---------- */
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("report");

  /* ---------- FETCH RULES ---------- */
  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await apiRequest("/api/rules");
        setRules(Array.isArray(data) ? data : []);
        setCategories([...new Set((data || []).map((r) => r.category))]);
      } catch (err) {
        console.error("Error fetching rules:", err);
        setRules([]);
        setCategories([]);
      }
    }
    fetchRules();
  }, []);

  /* ---------- LOCATION ---------- */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationStatus("Location detected ✓");
      },
      (err) => {
        console.error("Location error:", err);
        setLocationStatus("Location denied - Please enable location access");
      }
    );
  }, []);

  /* ---------- FETCH NEARBY PROPERTIES ---------- */
  const fetchNearbyProperties = async () => {
    if (!latitude || !longitude) return;
    try {
      const data = await apiRequest(
        `/api/properties/nearby?lat=${latitude}&lng=${longitude}&radius=3000`
      );
      setNearbyProperties(data.properties || []);
    } catch (err) {
      console.error("Error fetching nearby properties:", err);
      setNearbyProperties([]);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyProperties();
    }
  }, [latitude, longitude]);

  /* ---------- FETCH MY VIOLATIONS ---------- */
  const fetchViolations = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/violations");
      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching violations:", err);
      setViolations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRuleCode) {
      setError("Please select a violation type");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Location not available. Please enable location access.");
      return;
    }

    const formData = new FormData();
    formData.append("violationType", selectedRuleCode);
    formData.append("description", description);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    // Add related property if selected
    if (selectedPropertyId) {
      formData.append("relatedProperty", selectedPropertyId);
    }

    files.forEach((f) => formData.append("media", f));

    try {
      await apiUpload("/api/violations", formData);

      setMessage("✅ Violation reported successfully!");
      
      // Reset form
      setDescription("");
      setFiles([]);
      setSelectedCategory("");
      setSelectedRuleCode("");
      setSelectedPropertyId(null);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // Refresh violations list
      fetchViolations();
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to submit violation");
    }
  };

  /* ---------- UI ---------- */
  return (
    <Layout onLogout={onLogout}>
      <div style={{ 
        maxWidth: 1000, 
        margin: "0 auto", 
        padding: "30px 20px",
        backgroundColor: "#f5f7fa"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ 
            margin: 0, 
            marginBottom: "8px",
          color: "#1a202c",
          fontSize: "28px",
          fontWeight: "600"
        }}>
          🏛️ Citizen Dashboard
        </h2>
        <p style={{ 
          color: "#718096", 
          margin: 0,
          fontSize: "15px"
        }}>
          Report environmental violations in your area
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        marginBottom: "25px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0"
        }}>
          <button
            onClick={() => setActiveTab("report")}
            style={{
              flex: 1,
              padding: "16px 24px",
              backgroundColor: activeTab === "report" ? "#0056b3" : "transparent",
              color: activeTab === "report" ? "white" : "#4a5568",
              border: "none",
              fontWeight: activeTab === "report" ? "600" : "500",
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.2s",
              borderBottom: activeTab === "report" ? "3px solid #0056b3" : "none"
            }}
          >
            📝 Report Violation
          </button>
          <button
            onClick={() => setActiveTab("nearby")}
            style={{
              flex: 1,
              padding: "16px 24px",
              backgroundColor: activeTab === "nearby" ? "#0056b3" : "transparent",
              color: activeTab === "nearby" ? "white" : "#4a5568",
              border: "none",
              fontWeight: activeTab === "nearby" ? "600" : "500",
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.2s",
              borderBottom: activeTab === "nearby" ? "3px solid #0056b3" : "none"
            }}
          >
            🏘️ Nearby Properties
          </button>
        </div>
      </div>

      {/* Location Status */}
      <div
        style={{
          padding: "14px 18px",
          backgroundColor: locationStatus.includes("✓") ? "#d1fae5" : "#fef3c7",
          border: `1px solid ${locationStatus.includes("✓") ? "#6ee7b7" : "#fcd34d"}`,
          borderRadius: "8px",
          marginBottom: "25px",
          color: locationStatus.includes("✓") ? "#065f46" : "#92400e",
          fontWeight: "500"
        }}
      >
        📍 {locationStatus}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "25px",
            fontWeight: "500"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#d1fae5",
            color: "#065f46",
            border: "1px solid #6ee7b7",
            borderRadius: "8px",
            marginBottom: "25px",
            fontWeight: "500"
          }}
        >
          {message}
        </div>
      )}
      {/* Tab Content */}
      {activeTab === "report" && (
        <>      {/* Report Form */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          marginBottom: "35px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      >
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: "25px",
          color: "#1a202c",
          fontSize: "22px",
          fontWeight: "600"
        }}>
          📝 Report a Violation
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Category Select */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "15px"
              }}
            >
              1. Select Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedRuleCode("");
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#2d3748",
                cursor: "pointer",
                transition: "border-color 0.2s"
              }}
            >
              <option value="">-- Choose a category --</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Select */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "15px"
              }}
            >
              2. Select Violation Type:
            </label>
            <select
              disabled={!selectedCategory}
              value={selectedRuleCode}
              onChange={(e) => setSelectedRuleCode(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                backgroundColor: !selectedCategory ? "#f7fafc" : "white",
                color: !selectedCategory ? "#a0aec0" : "#2d3748",
                cursor: !selectedCategory ? "not-allowed" : "pointer"
              }}
            >
              <option value="">-- Choose a violation type --</option>
              {rules
                .filter((r) => r.category === selectedCategory)
                .map((r) => (
                  <option key={r.violation_code} value={r.violation_code}>
                    {r.violation_code} - {r.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "15px"
              }}
            >
              3. Description (Optional):
            </label>
            <textarea
              placeholder="Provide additional details about the violation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "15px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontFamily: "inherit",
                color: "#2d3748",
                resize: "vertical"
              }}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "15px"
              }}
            >
              4. Upload Evidence (Photos/Videos):
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => setFiles([...e.target.files])}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: "pointer"
              }}
            />
            {files.length > 0 && (
              <small style={{ 
                color: "#718096", 
                marginTop: "8px", 
                display: "block",
                fontSize: "14px"
              }}>
                📎 {files.length} file(s) selected
              </small>
            )}
          </div>

          {/* Location Map Picker */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#2d3748",
                fontSize: "15px"
              }}
            >
              5. Set Violation Location:
            </label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
                setLocationStatus("Location updated ✓");
              }}
            />
            {latitude && longitude && (
              <div style={{
                marginTop: "8px",
                padding: "8px 12px",
                backgroundColor: "#f7fafc",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#4a5568"
              }}>
                <strong>Current Location:</strong> {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </div>
            )}
          </div>

          {/* Nearby Properties Selector */}
          {latitude && longitude && nearbyProperties.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                  color: "#2d3748",
                  fontSize: "15px"
                }}
              >
                6. Link to Property (Optional):
              </label>
              <div style={{
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                marginBottom: "12px",
                border: "1px solid #bfdbfe",
                fontSize: "14px",
                color: "#1e40af"
              }}>
                ℹ️ {nearbyProperties.length} registered {nearbyProperties.length === 1 ? 'property' : 'properties'} found nearby. 
                Select one if the violation is related to a specific property.
              </div>
              <select
                value={selectedPropertyId || ""}
                onChange={(e) => setSelectedPropertyId(e.target.value || null)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "15px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#2d3748",
                  cursor: "pointer",
                  marginBottom: "12px"
                }}
              >
                <option value="">-- None (General Area Violation) --</option>
                {nearbyProperties.map((prop) => (
                  <option key={prop._id} value={prop._id}>
                    {prop.propertyName} - {prop.address} ({prop.distanceKm}km away)
                  </option>
                ))}
              </select>
              <PropertyMapSelector
                latitude={latitude}
                longitude={longitude}
                properties={nearbyProperties}
                onPropertySelect={(property) => setSelectedPropertyId(property._id)}
                selectedPropertyId={selectedPropertyId}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              padding: "14px 32px",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(49, 130, 206, 0.2)"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#2c5282";
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 8px rgba(49, 130, 206, 0.3)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#3182ce";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(49, 130, 206, 0.2)";
            }}
          >
            🚀 Submit Violation Report
          </button>
        </form>
      </div>

      {/* My Complaints Section */}
      <div style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ 
          marginTop: 0,
          marginBottom: "20px",
          color: "#1a202c",
          fontSize: "22px",
          fontWeight: "600"
        }}>
          📋 My Complaints
        </h3>

        {loading ? (
          <p style={{ 
            textAlign: "center", 
            padding: "40px", 
            color: "#718096",
            fontSize: "16px"
          }}>
            ⏳ Loading your complaints...
          </p>
        ) : violations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              backgroundColor: "#f7fafc",
              borderRadius: "8px",
              color: "#718096",
            }}
          >
            <p style={{ fontSize: "18px", marginBottom: "10px", fontWeight: "500" }}>
              📭 No complaints submitted yet
            </p>
            <p style={{ fontSize: "15px", margin: 0 }}>
              Your reported violations will appear here
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                backgroundColor: "white",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #e2e8f0"
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f7fafc" }}>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    borderBottom: "2px solid #e2e8f0",
                    color: "#2d3748",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    📅 Date
                  </th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    borderBottom: "2px solid #e2e8f0",
                    color: "#2d3748",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    🏷️ Rule Code
                  </th>
                  <th style={{ 
                    padding: "16px 20px", 
                    textAlign: "left", 
                    borderBottom: "2px solid #e2e8f0",
                    color: "#2d3748",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    📊 Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v, i) => (
                  <tr
                    key={v?._id || i}
                    style={{
                      borderBottom: i !== violations.length - 1 ? "1px solid #e2e8f0" : "none",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f7fafc"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ 
                      padding: "16px 20px",
                      color: "#4a5568",
                      fontSize: "14px"
                    }}>
                      {v?.createdAt
                        ? new Date(v.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td style={{ 
                      padding: "16px 20px", 
                      fontWeight: "600",
                      color: "#2d3748",
                      fontSize: "14px"
                    }}>
                      {v?.violationType ?? "UNKNOWN"}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: "600",
                          backgroundColor:
                            v?.status === "AWAITING_OWNER"
                              ? "#fef3c7"
                              : v?.status === "PAID"
                              ? "#d1fae5"
                              : v?.status === "OBJECTED"
                              ? "#fee2e2"
                              : "#f3f4f6",
                          color:
                            v?.status === "AWAITING_OWNER"
                              ? "#92400e"
                              : v?.status === "PAID"
                              ? "#065f46"
                              : v?.status === "OBJECTED"
                              ? "#991b1b"
                              : "#4b5563",
                        }}
                      >
                        {v?.status ?? "PENDING"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Nearby Properties Tab */}
      {activeTab === "nearby" && <CitizenNearbyProperties />}
      </div>
    </Layout>
  );
}

export default Citizen;