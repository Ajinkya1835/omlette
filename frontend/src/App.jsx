import { useState } from "react";
import Login from "./pages/Login";
import Citizen from "./pages/Citizen";
import Owner from "./pages/Owner";
import Officer from "./pages/Officer";

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === "CITIZEN") {
    return <Citizen />;
  }

  if (user.role === "OWNER") {
    return <Owner />;
  }

  if (user.role === "OFFICER") {
    return <Officer />;
  }

  return <p>Unknown role</p>;
}

export default App;
