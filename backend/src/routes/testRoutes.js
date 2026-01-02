import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/protected", protect, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

router.get(
  "/admin-only",
  protect,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

export default router;
