// frontend/src/components/GovFooter.jsx
import "./GovFooter.css";

function GovFooter() {
  return (
    <footer className="gov-footer">
      <div className="footer-container">
        <p>© 2026 Government of India - Municipal Corporation. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#terms">Terms of Service</a>
          <span>•</span>
          <a href="#help">Help & Support</a>
        </div>
      </div>
    </footer>
  );
}

export default GovFooter;
