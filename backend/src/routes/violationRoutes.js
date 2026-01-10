import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createViolation,
  getViolations,
  acceptViolation,
  objectViolation,
  getOfficerViolations,
  officerConfirm,
  officerOverride,
} from "../controllers/violationController.js";

const router = express.Router();

// ✅ Only ONE POST route with upload middleware
router.post("/", protect, upload.array("media", 5), createViolation);
router.get("/", protect, getViolations);

router.post("/:id/accept", protect, acceptViolation);
router.post("/:id/object", protect, objectViolation);
router.get("/officer", protect, getOfficerViolations);
router.post("/:id/confirm", protect, officerConfirm);
router.post("/:id/override", protect, officerOverride);

export default router;