import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

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
      const data = await apiRequest("/api/rules");
      setRules(Array.isArray(data) ? data : []);
      setCategories([...new Set((data || []).map((r) => r.category))]);
    }
    fetchRules();
  }, []);

  /* ---------- LOCATION ---------- */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationStatus("Location detected");
      },
      () => setLocationStatus("Location denied")
    );
  }, []);

  /* ---------- FETCH MY VIOLATIONS ---------- */
  const fetchViolations = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/violations");
      setViolations(Array.isArray(data) ? data : []);
    } catch {
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
      setError("Please select a rule");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Location not available");
      return;
    }

    const formData = new FormData();
    formData.append("violationType", selectedRuleCode);
    formData.append("description", description);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    files.forEach((f) => formData.append("media", f));

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/violations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("Violation reported successfully");
      setDescription("");
      setFiles([]);
      setSelectedCategory("");
      setSelectedRuleCode("");

      fetchViolations();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div style={{ maxWidth: 800 }}>
      <h2>Citizen Dashboard</h2>

      <p>📍 {locationStatus}</p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedRuleCode("");
          }}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <br /><br />

        <select
          disabled={!selectedCategory}
          value={selectedRuleCode}
          onChange={(e) => setSelectedRuleCode(e.target.value)}
        >
          <option value="">Select rule</option>
          {rules
            .filter((r) => r.category === selectedCategory)
            .map((r) => (
              <option key={r.violation_code} value={r.violation_code}>
                {r.title}
              </option>
            ))}
        </select>

        <br /><br />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br /><br />

        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles([...e.target.files])}
        />

        <br /><br />

        <button type="submit">Submit Violation</button>
      </form>

      <h3 style={{ marginTop: 40 }}>My Complaints</h3>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Date</th>
              <th>Rule</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(violations || []).map((v, i) => (
              <tr key={v?._id || i}>
                <td>
                  {v?.createdAt
                    ? new Date(v.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td>{v?.violationType ?? "UNKNOWN"}</td>
                <td>{v?.status ?? "PENDING"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Citizen;
