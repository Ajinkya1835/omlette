import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function Citizen() {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRule, setSelectedRule] = useState(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch rules on load
  useEffect(() => {
    async function fetchRules() {
      try {
        const data = await apiRequest("/api/rules");
        setRules(data);

        // Extract unique categories
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

  // Filter rules by category
  const filteredRules = rules.filter(
    (r) => r.category === selectedCategory
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRule) {
      setError("Please select a rule");
      return;
    }

    try {
      await apiRequest("/api/violations", {
        method: "POST",
        body: JSON.stringify({
          violationType: selectedRule.violation_code,
          description,
        }),
      });

      setMessage("Violation reported successfully");
      setSelectedCategory("");
      setSelectedRule(null);
      setDescription("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>Citizen Dashboard</h2>

      <h3>Report a Violation</h3>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Category Dropdown */}
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

        {/* Rule Dropdown */}
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

        {/* Description */}
        <label>Description (optional)</label>
        <br />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br /><br />

        <button type="submit">Submit Violation</button>
      </form>
    </div>
  );
}

export default Citizen;
