// backend/src/routes/ownerRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getOwnerViolations,
  acceptViolation,
  objectViolation,
} from "../controllers/ownerController.js";

const router = express.Router();

router.get("/violations", protect, authorizeRoles("PERMIT_HOLDER"), getOwnerViolations);
router.post("/violations/:id/accept", protect, authorizeRoles("PERMIT_HOLDER"), acceptViolation);
router.post("/violations/:id/object", protect, authorizeRoles("PERMIT_HOLDER"), objectViolation);

export default router;