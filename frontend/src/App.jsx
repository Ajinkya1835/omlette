import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiRequest from "./api/api.js";
import Login from "./pages/Login";
import CitizenRegister from "./pages/CitizenRegister";
import OwnerRegister from "./pages/OwnerRegister";
import Citizen from "./pages/Citizen";
import Owner from "./pages/Owner";
import Officer from "./pages/Officer";

function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          // Optionally validate token with backend
          await apiRequest("/api/auth/verify-token").catch(() => {
            // If token is invalid, logout
            handleLogout();
          });
        } catch (error) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f5f5f5", fontSize: "18px" }}>Loading...</div>;
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh" }}>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === "CITIZEN" ? "/citizen" : user.role === "PERMIT_HOLDER" ? "/owner" : "/officer"} replace /> : <Login onLogin={handleLogin} />}
        />
        <Route path="/register/citizen" element={<CitizenRegister />} />
        <Route path="/register/owner" element={<OwnerRegister />} />

        {/* Protected Routes */}
        <Route
          path="/citizen"
          element={
            <ProtectedRoute user={user} requiredRole="CITIZEN">
              <Citizen onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute user={user} requiredRole="PERMIT_HOLDER">
              <Owner onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer"
          element={
            <ProtectedRoute user={user} requiredRole="OFFICER">
              <Officer onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to={user ? (user.role === "CITIZEN" ? "/citizen" : user.role === "PERMIT_HOLDER" ? "/owner" : "/officer") : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
