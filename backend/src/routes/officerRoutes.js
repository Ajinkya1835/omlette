// backend/src/routes/officerRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  // Violation management
  getObjectedViolations,
  confirmViolation,
  overrideViolation,
  // User approval
  getPendingCitizens,
  getPendingOwners,
  getPendingProperties,
  approveCitizen,
  approveOwner,
  rejectUser,
  approveProperty,
  rejectProperty,
  getDashboardStats,
} from "../controllers/officerController.js";

const router = express.Router();

// VIOLATION MANAGEMENT ROUTES
router.get("/violations", protect, authorizeRoles("OFFICER"), getObjectedViolations);
router.post("/violations/:id/confirm", protect, authorizeRoles("OFFICER"), confirmViolation);
router.post("/violations/:id/override", protect, authorizeRoles("OFFICER"), overrideViolation);

// APPROVAL MANAGEMENT ROUTES
router.get("/pending-citizens", protect, authorizeRoles("OFFICER"), getPendingCitizens);
router.get("/pending-owners", protect, authorizeRoles("OFFICER"), getPendingOwners);
router.get("/pending-properties", protect, authorizeRoles("OFFICER"), getPendingProperties);

router.post("/approve-citizen/:userId", protect, authorizeRoles("OFFICER"), approveCitizen);
router.post("/approve-owner/:userId", protect, authorizeRoles("OFFICER"), approveOwner);
router.post("/approve-property/:propertyId", protect, authorizeRoles("OFFICER"), approveProperty);

router.post("/reject-user/:userId", protect, authorizeRoles("OFFICER"), rejectUser);
router.post("/reject-property/:propertyId", protect, authorizeRoles("OFFICER"), rejectProperty);

// DASHBOARD STATS
router.get("/dashboard-stats", protect, authorizeRoles("OFFICER"), getDashboardStats);

export default router;