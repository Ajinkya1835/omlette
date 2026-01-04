// backend/src/routes/ownerRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getOwnerProfile,
  updateOwnerProfile,
  getOwnerProperties,
  addProperty,
  updateProperty,
  getOwnerViolations,
  acceptViolation,
  objectViolation,
} from "../controllers/ownerController.js";

const router = express.Router();

// Profile routes
router.get("/profile", protect, authorizeRoles("PERMIT_HOLDER"), getOwnerProfile);
router.put("/profile", protect, authorizeRoles("PERMIT_HOLDER"), updateOwnerProfile);

// Property routes
router.get("/properties", protect, authorizeRoles("PERMIT_HOLDER"), getOwnerProperties);
router.post("/properties", protect, authorizeRoles("PERMIT_HOLDER"), addProperty);
router.put("/properties/:id", protect, authorizeRoles("PERMIT_HOLDER"), updateProperty);

// Violation routes
router.get("/violations", protect, authorizeRoles("PERMIT_HOLDER"), getOwnerViolations);
router.post("/violations/:id/accept", protect, authorizeRoles("PERMIT_HOLDER"), acceptViolation);
router.post("/violations/:id/object", protect, authorizeRoles("PERMIT_HOLDER"), objectViolation);

export default router;