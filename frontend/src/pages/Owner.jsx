// frontend/src/pages/Owner.jsx
import { useState } from "react";
import OwnerLayout from "./OwnerLayout";
import OwnerDashboard from "./OwnerDashboard";
import OwnerProfile from "./OwnerProfile";
import OwnerProperties from "./OwnerProperties";
import OwnerViolations from "./OwnerViolations";
import MapSearchPanel from "../components/MapSearchPanel";

function Owner({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <OwnerDashboard onNavigate={setCurrentPage} />;
      case "profile":
        return <OwnerProfile onNavigate={setCurrentPage} />;
      case "properties":
        return <OwnerProperties onNavigate={setCurrentPage} />;
      case "violations":
        return <OwnerViolations onNavigate={setCurrentPage} />;
      case "map":
        return <MapSearchPanel userRole="PERMIT_HOLDER" />;
      default:
        return <OwnerDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <OwnerLayout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={onLogout}>
      {renderPage()}
    </OwnerLayout>
  );
}

export default Owner;