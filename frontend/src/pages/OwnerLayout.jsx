// frontend/src/pages/OwnerLayout.jsx
import { useState } from "react";
import "./OwnerLayout.css";

function OwnerLayout({ children, currentPage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      window.location.reload();
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "properties", label: "My Properties", icon: "🏢" },
    { id: "violations", label: "My Violations", icon: "⚠️" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="owner-layout">
      {/* Government Header */}
      <header className="govt-header">
        <div className="header-top">
          <div className="header-logo">
            <div className="emblem">🇮🇳</div>
            <div className="header-text">
              <h1>भारत सरकार | Government of India</h1>
              <h2>Municipal Corporation - Violation Management System</h2>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="govt-nav">
        <div className="nav-container">
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰ Menu
          </button>
          <ul className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${currentPage === item.id ? "active" : ""}`}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="govt-content">
        <div className="content-wrapper">{children}</div>
      </main>

      {/* Footer */}
      <footer className="govt-footer">
        <div className="footer-content">
          <p>© 2026 Municipal Corporation of India. All Rights Reserved.</p>
          <p className="footer-links">
            <a href="#privacy">Privacy Policy</a> | <a href="#terms">Terms of Service</a> |{" "}
            <a href="#help">Help & Support</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default OwnerLayout;
