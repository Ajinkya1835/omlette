import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "../api/api.js";
import "./AuthPages.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegistrationMenu, setShowRegistrationMenu] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === "CITIZEN") {
        navigate("/citizen");
      } else if (data.user.role === "PERMIT_HOLDER") {
        navigate("/owner");
      } else if (data.user.role === "OFFICER") {
        navigate("/officer");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🏛️ PVMS Portal</h1>
            <p>Public Violation Management System</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              New to PVMS?{" "}
              <button
                className="link-button"
                onClick={() => setShowRegistrationMenu(!showRegistrationMenu)}
              >
                Register Here
              </button>
            </p>

            {showRegistrationMenu && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                <p style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>
                  Register as:
                </p>
                <button
                  className="link-button"
                  onClick={() => navigate("/register/citizen")}
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Citizen
                </button>
                <button
                  className="link-button"
                  onClick={() => navigate("/register/owner")}
                  style={{ display: "block" }}
                >
                  Permit Holder / Owner
                </button>
              </div>
            )}

            <div className="approval-notice" style={{ marginTop: "12px" }}>
              ℹ️ New registrations require municipal officer approval before account activation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
