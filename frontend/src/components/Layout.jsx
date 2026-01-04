// frontend/src/components/Layout.jsx
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";
import "./Layout.css";

function Layout({ children, onLogout }) {
  return (
    <div className="layout">
      <GovHeader onLogout={onLogout} />
      <main className="layout-main">{children}</main>
      <GovFooter />
    </div>
  );
}

export default Layout;
