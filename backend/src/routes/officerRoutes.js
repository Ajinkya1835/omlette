// backend/src/routes/officerRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getObjectedViolations,
  confirmViolation,
  overrideViolation,
} from "../controllers/officerController.js";

const router = express.Router();

router.get("/violations", protect, authorizeRoles("OFFICER"), getObjectedViolations);
router.post("/violations/:id/confirm", protect, authorizeRoles("OFFICER"), confirmViolation);
router.post("/violations/:id/override", protect, authorizeRoles("OFFICER"), overrideViolation);

export default router;