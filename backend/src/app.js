import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import violationRoutes from "./routes/violationRoutes.js";


const app = express();

app.use(cors());
app.use(express.json()); // ✅ THIS LINE IS CRITICAL

app.use("/api/violations", violationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
