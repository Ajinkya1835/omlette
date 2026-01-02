import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  createViolation,
  getViolations,
  acceptViolation,
  objectViolation,
  officerConfirm,
  officerOverride,
} from "../controllers/violationController.js";

const router = express.Router();

router.post("/", protect, createViolation);
router.get("/", protect, getViolations);

router.post("/:id/accept", protect, acceptViolation);
router.post("/:id/object", protect, objectViolation);

// Officer review (appeal court)
router.post("/:id/confirm", protect, officerConfirm);
router.post("/:id/override", protect, officerOverride);

export default router;
