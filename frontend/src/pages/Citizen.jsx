import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function Citizen() {
  // Rule data
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRule, setSelectedRule] = useState(null);

  // Form fields
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  // Location
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Detecting location…");

  // UI feedback
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ---------------- FETCH RULES ---------------- */
  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await apiRequest("/api/rules");
        setRules(data);

        const uniqueCategories = [
          ...new Set(data.map((r) => r.category)),
        ];
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchRules();
  }, []);

  /* ---------------- AUTO GPS ---------------- */
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocationStatus("Location detected");
      },
      () => {
        setLocationStatus("Location permission denied");
      }
    );
  }, []);

  /* ---------------- FILTER RULES ---------------- */
  const filteredRules = rules.filter(
    (r) => r.category === selectedCategory
  );

  /* ---------------- SUBMIT HANDLER ---------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRule) {
      setError("Please select a rule");
      return;
    }

    if (latitude === null || longitude === null) {
      setError("Location not available");
      return;
    }

    const formData = new FormData();
    formData.append("violationType", selectedRule.violation_code);
    formData.append("description", description);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    files.forEach((file) => {
      formData.append("media", file);
    });

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://pvms.onrender.com/api/violations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Submission failed");
      }

      setMessage("Violation reported successfully");
      setSelectedCategory("");
      setSelectedRule(null);
      setDescription("");
      setFiles([]);
    } catch (err) {
      setError(err.message);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div style={{ maxWidth: 650 }}>
      <h2>Citizen Dashboard</h2>

      <h3>Report a Violation</h3>

      <p>
        📍 <strong>{locationStatus}</strong>
        {latitude && longitude && (
          <span>
            {" "}
            ({latitude.toFixed(5)}, {longitude.toFixed(5)})
          </span>
        )}
      </p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* CATEGORY */}
        <label>Category</label>
        <br />
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedRule(null);
          }}
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <br /><br />

        {/* RULE */}
        <label>Rule</label>
        <br />
        <select
          disabled={!selectedCategory}
          value={selectedRule?.violation_code || ""}
          onChange={(e) =>
            setSelectedRule(
              filteredRules.find(
                (r) => r.violation_code === e.target.value
              )
            )
          }
        >
          <option value="">Select rule</option>
          {filteredRules.map((rule) => (
            <option key={rule.violation_code} value={rule.violation_code}>
              {rule.title}
            </option>
          ))}
        </select>

        <br /><br />

        {/* DESCRIPTION */}
        <label>Description (optional)</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br /><br />

        {/* FILE UPLOAD */}
        <label>Upload Evidence (Photo / Video)</label>
        <br />
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles([...e.target.files])}
        />

        <br /><br />

        <button
          type="submit"
          disabled={latitude === null || longitude === null}
        >
          Submit Violation
        </button>
      </form>
    </div>
  );
}

export default Citizen;
