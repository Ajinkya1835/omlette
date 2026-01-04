// frontend/src/components/GovHeader.jsx
import "./GovHeader.css";

function GovHeader({ onLogout }) {
  return (
    <header className="gov-header">
      <div className="header-container">
        <div className="header-logo">
          <div className="emblem">🇮🇳</div>
          <div className="header-text">
            <h1>भारत सरकार | Government of India</h1>
            <h2>Public Violation Management System (PVMS)</h2>
          </div>
        </div>
        {onLogout && (
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default GovHeader;
