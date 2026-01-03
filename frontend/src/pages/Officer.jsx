import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import "./Officer.css";

function Officer() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/violations/officer");
      setViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const confirmViolation = async (id) => {
    if (!window.confirm("Confirm this violation?")) return;
    await apiRequest(`/api/violations/${id}/confirm`, { method: "POST" });
    fetchViolations();
  };

  const overrideViolation = async (id) => {
    const reason = prompt("Enter reason for override:");
    if (!reason) return;

    await apiRequest(`/api/violations/${id}/override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    fetchViolations();
  };

  return (
    <div className="gov-container">
      <h1>Municipal Officer Dashboard</h1>
      <p className="subtitle">
        Objected Violations Pending Review
      </p>

      {loading && <p>Loading records…</p>}
      {error && <p className="error">{error}</p>}

      {violations.length === 0 ? (
        <p className="empty">No objected violations found</p>
      ) : (
        <table className="gov-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Citizen</th>
              <th>Rule</th>
              <th>Description</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v) => (
              <tr key={v._id}>
                <td>{new Date(v.createdAt).toLocaleString()}</td>
                <td>
                  {v.reportedBy?.name || "Citizen"}
                  <br />
                  <small>{v.reportedBy?.email}</small>
                </td>
                <td>{v.violationType}</td>
                <td>{v.description || "—"}</td>
                <td>
                  <button
                    className="btn-confirm"
                    onClick={() => confirmViolation(v._id)}
                  >
                    Confirm
                  </button>
                  <button
                    className="btn-override"
                    onClick={() => overrideViolation(v._id)}
                  >
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Officer;
