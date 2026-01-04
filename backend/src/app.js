import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import violationRoutes from "./routes/violationRoutes.js";
import ruleRoutes from "./routes/ruleRoutes.js";
import officerRoutes from "./routes/officerRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import mapSearchRoutes from "./routes/mapSearchRoutes.js";

const app = express();

app.use(cors());
app.use(express.json()); // ✅ THIS LINE IS CRITICAL

app.use("/api/violations", violationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/officer", officerRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/map", mapSearchRoutes);


app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "PVMS backend is live",
    time: new Date().toISOString()
  });
});

export default app;
