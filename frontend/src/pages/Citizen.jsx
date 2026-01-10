import { useEffect, useState } from "react";
import apiRequest, { apiUpload } from "../api/api.js";
import Layout from "../components/Layout.jsx";
import MapPicker from "../components/MapPicker.jsx";
import CitizenProfile from "../components/CitizenProfile.jsx";
import DashboardStats from "../components/DashboardStats.jsx";
import ReportSteps from "../components/ReportSteps.jsx";
import SubmissionModal from "../components/SubmissionModal.jsx";
import ComplaintsTable from "../components/ComplaintsTable.jsx";

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
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [allProperties, setAllProperties] = useState([]);

  /* ---------- VIOLATIONS ---------- */
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- UI ---------- */
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

  /* ---------- FETCH ALL PROPERTIES ---------- */
  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await apiRequest("/api/properties/all");
        setAllProperties(Array.isArray(data.properties) ? data.properties : []);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setAllProperties([]);
      }
    }
    fetchProperties();
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
      // Not used anymore - keeping for potential future use
    } catch (err) {
      console.error("Error fetching nearby properties:", err);
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

  /* ---------- STEP TRACKING ---------- */
  useEffect(() => {
    // Update step based on form completion
    if (!selectedCategory) {
      setCurrentStep(1);
    } else if (!files.length) {
      setCurrentStep(2);
    } else if (!latitude || !longitude) {
      setCurrentStep(3);
    } else {
      setCurrentStep(4);
    }
  }, [selectedCategory, files, latitude, longitude]);

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Form submitted!");
    setError("");
    setMessage("");
    setLoading(true);

    console.log("Validation checks:");
    console.log("- selectedRuleCode:", selectedRuleCode);
    console.log("- latitude:", latitude);
    console.log("- longitude:", longitude);
    console.log("- confirmationChecked:", confirmationChecked);

    if (!selectedRuleCode) {
      setError("Please select a violation type");
      setLoading(false);
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Location not available. Please enable location access.");
      setLoading(false);
      return;
    }

    if (!confirmationChecked) {
      setError("Please confirm that the information provided is accurate");
      setLoading(false);
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

    console.log("Submitting violation:", {
      violationType: selectedRuleCode,
      latitude,
      longitude,
      filesCount: files.length
    });

    try {
      const response = await apiUpload("/api/violations", formData);
      
      console.log("✅ Violation submitted successfully:", response);
      
      // Store complaint data and show modal
      setSubmittedComplaint(response);
      setShowModal(true);
      
      // Reset form
      setDescription("");
      setFiles([]);
      setSelectedCategory("");
      setSelectedRuleCode("");
      setSelectedPropertyId(null);
      setConfirmationChecked(false);
      setCurrentStep(1);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // Refresh violations list
      fetchViolations();
    } catch (err) {
      console.error("❌ Error submitting violation:", err);
      setError(err.message || "Failed to submit violation");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Layout onLogout={onLogout}>
      <div style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "30px 20px",
        backgroundColor: "#f8fafc"
      }}>
        {/* Header with Profile */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "30px",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "25px 30px",
            borderRadius: "12px",
            flex: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: "4px solid #2c5282"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "32px" }}>🏛️</span>
              <h2 style={{ 
                margin: 0,
                color: "#1e3a5f",
                fontSize: "28px",
                fontWeight: "700"
              }}>
                Citizen Portal
              </h2>
            </div>
            <p style={{ 
              color: "#475569", 
              margin: 0,
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Public Violation Management System • Government of India Initiative
            </p>
          </div>
          
          <CitizenProfile user={user} onLogout={onLogout} />
        </div>

        {/* Dashboard Stats */}
        <DashboardStats violations={violations} />

        {/* Location Status */}
        <div
          style={{
            padding: "14px 20px",
            backgroundColor: locationStatus.includes("✓") ? "#ecfdf5" : "#fef9e7",
            border: `1.5px solid ${locationStatus.includes("✓") ? "#6ee7b7" : "#fcd34d"}`,
            borderRadius: "8px",
            marginBottom: "25px",
            color: locationStatus.includes("✓") ? "#065f46" : "#92400e",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          📍 {locationStatus}
        </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            border: "1.5px solid #fecaca",
            borderRadius: "8px",
            marginBottom: "25px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
          </svg>
          {error}
        </div>
      )}
      {/* Report Form */}
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          marginBottom: "35px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}
      >

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2c5282 0%, #1e40af 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px"
          }}>
            📝
          </div>
          <h3 style={{ 
            margin: 0,
            color: "#1e3a5f",
            fontSize: "24px",
            fontWeight: "700"
          }}>
            Report a Violation
          </h3>
        </div>
        <p style={{
          color: "#64748b",
          margin: "0 0 24px 0",
          fontSize: "14px"
        }}>
          All information submitted will be verified by authorities. False reports may lead to legal action.
        </p>

        <form onSubmit={handleSubmit}>

        {/* Progress Steps */}
        <ReportSteps currentStep={currentStep} />

          {/* Related Property Select */}
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
              Related Property
            </label>
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
                transition: "border-color 0.2s"
              }}
            >
              <option value="">-- Select property (optional) --</option>
              {allProperties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.propertyName} — {prop.propertyType}
                </option>
              ))}
            </select>
          </div>

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
              Select Category
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
              Select Violation Type
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
              Description (Optional)
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
                lineHeight: "1.6",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                color: "#2d3748",
                resize: "vertical",
                fontWeight: "400",
                letterSpacing: "0.01em"
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
              Upload Evidence (Photos/Videos)
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
              Set Violation Location & View Properties
            </label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
                setLocationStatus("Location updated ✓");
              }}
              properties={allProperties}
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

          {/* Confirmation Checkbox */}
          <div style={{ 
            marginBottom: "28px", 
            padding: "20px", 
            background: "#fef9e7", 
            border: "2px solid #fcd34d", 
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(252, 211, 77, 0.2)"
          }}>
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              cursor: "pointer",
              fontSize: "15px",
              lineHeight: "1.6"
            }}>
              <input
                type="checkbox"
                checked={confirmationChecked}
                onChange={(e) => {
                  console.log("Checkbox clicked:", e.target.checked);
                  setConfirmationChecked(e.target.checked);
                }}
                style={{
                  marginTop: "4px",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  accentColor: "#2c5282",
                  flexShrink: 0
                }}
              />
              <span style={{ color: "#92400e", fontWeight: "500" }}>
                <strong style={{ fontSize: "16px" }}>⚠️ Declaration:</strong> I hereby confirm that the information provided above is true and accurate to the best of my knowledge. I understand that providing false information may result in legal consequences under applicable laws.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!confirmationChecked || loading}
            style={{
              width: "100%",
              padding: "16px 32px",
              backgroundColor: (confirmationChecked && !loading) ? "#2c5282" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: (confirmationChecked && !loading) ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: (confirmationChecked && !loading) ? "0 4px 12px rgba(44, 82, 130, 0.25)" : "none",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}
            onMouseOver={(e) => {
              if (confirmationChecked && !loading) {
                e.target.style.backgroundColor = "#1e40af";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(44, 82, 130, 0.35)";
              }
            }}
            onMouseOut={(e) => {
              if (confirmationChecked && !loading) {
                e.target.style.backgroundColor = "#2c5282";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(44, 82, 130, 0.25)";
              }
            }}
          >
            {loading ? (
              <>
                <svg className="spinner" width="20" height="20" viewBox="0 0 50 50" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 31.4" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                Submit Official Complaint
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Complaints Section */}
      <div style={{
        backgroundColor: "white",
        padding: "32px",
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px"
            }}>
              📋
            </div>
            <div>
              <h3 style={{ 
                margin: 0,
                color: "#1e3a5f",
                fontSize: "24px",
                fontWeight: "700"
              }}>
                My Complaints
              </h3>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                Track and manage your submitted violation reports
              </p>
            </div>
          </div>
          <div style={{
            padding: "8px 16px",
            background: "#eff6ff",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "700",
            color: "#2c5282"
          }}>
            Total: {violations.length}
          </div>
        </div>

        <ComplaintsTable violations={violations} loading={loading} />
      </div>

      {/* Government Footer */}
      <div style={{
        marginTop: "40px",
        padding: "24px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "12px", opacity: 0.6 }}>
          <svg width="40" height="40" viewBox="0 0 100 100" style={{ display: "inline-block" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#2c5282" strokeWidth="3"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#2c5282" strokeWidth="2"/>
            <circle cx="50" cy="50" r="25" fill="none" stroke="#2c5282" strokeWidth="2"/>
            <circle cx="50" cy="50" r="4" fill="#2c5282"/>
          </svg>
        </div>
        <p style={{
          margin: "0 0 8px 0",
          fontSize: "13px",
          color: "#475569",
          fontWeight: "600"
        }}>
          🔒 Official Government Reporting Platform
        </p>
        <p style={{
          margin: 0,
          fontSize: "12px",
          color: "#64748b",
          lineHeight: "1.6"
        }}>
          All actions are logged and monitored for audit purposes • Data encrypted and securely stored<br/>
          Public Violation Management System • Ministry of Urban Development
        </p>
      </div>

      {/* Submission Modal */}
      <SubmissionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        complaintData={submittedComplaint}
      />
      </div>
    </Layout>
  );
}

export default Citizen;