import { useEffect, useState } from "react";
import { apiRequest, apiUpload } from "../api/api";

function Citizen() {
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

  /* ---------- VIOLATIONS ---------- */
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- UI ---------- */
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

    files.forEach((f) => formData.append("media", f));

    try {
      // ✅ Using the clean apiUpload helper
      await apiUpload("/api/violations", formData);

      setMessage("✅ Violation reported successfully!");
      
      // Reset form
      setDescription("");
      setFiles([]);
      setSelectedCategory("");
      setSelectedRuleCode("");
      
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "10px" }}>🏛️ Citizen Dashboard</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Report environmental violations in your area
      </p>

      {/* Location Status */}
      <div
        style={{
          padding: "10px 15px",
          backgroundColor: locationStatus.includes("✓") ? "#d4edda" : "#fff3cd",
          border: `1px solid ${locationStatus.includes("✓") ? "#c3e6cb" : "#ffeaa7"}`,
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        📍 {locationStatus}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}

      {/* Report Form */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "25px",
          borderRadius: "8px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
          📝 Report a Violation
        </h3>
        
        <form onSubmit={handleSubmit}>
          {/* Category Select */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
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
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "4px",
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
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
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
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: !selectedCategory ? "#e9ecef" : "white",
                cursor: !selectedCategory ? "not-allowed" : "pointer",
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
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
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
                padding: "10px",
                fontSize: "16px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
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
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
            {files.length > 0 && (
              <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                📎 {files.length} file(s) selected
              </small>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              padding: "12px 30px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
          >
            🚀 Submit Violation Report
          </button>
        </form>
      </div>

      {/* My Complaints Section */}
      <div>
        <h3 style={{ marginBottom: "15px" }}>📋 My Complaints</h3>

        {loading ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            ⏳ Loading your complaints...
          </p>
        ) : violations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              color: "#666",
            }}
          >
            <p style={{ fontSize: "18px", marginBottom: "10px" }}>
              📭 No complaints submitted yet
            </p>
            <p style={{ fontSize: "14px" }}>
              Your reported violations will appear here
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    📅 Date
                  </th>
                  <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    🏷️ Rule Code
                  </th>
                  <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                    📊 Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v, i) => (
                  <tr
                    key={v?._id || i}
                    style={{
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    <td style={{ padding: "15px" }}>
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
                    <td style={{ padding: "15px", fontWeight: "500" }}>
                      {v?.violationType ?? "UNKNOWN"}
                    </td>
                    <td style={{ padding: "15px" }}>
                      <span
                        style={{
                          padding: "5px 12px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                          backgroundColor:
                            v?.status === "AWAITING_OWNER"
                              ? "#fff3cd"
                              : v?.status === "PAID"
                              ? "#d4edda"
                              : v?.status === "OBJECTED"
                              ? "#f8d7da"
                              : "#e9ecef",
                          color:
                            v?.status === "AWAITING_OWNER"
                              ? "#856404"
                              : v?.status === "PAID"
                              ? "#155724"
                              : v?.status === "OBJECTED"
                              ? "#721c24"
                              : "#495057",
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
    </div>
  );
}

export default Citizen;