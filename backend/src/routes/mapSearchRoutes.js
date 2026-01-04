// backend/src/routes/mapSearchRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  searchViolationsOnMap,
  searchPropertiesOnMap,
  getNearbyViolations,
  getViolationClusters,
} from "../controllers/mapSearchController.js";

const router = express.Router();

// Map-based search endpoints
router.get("/violations/search", protect, searchViolationsOnMap);
router.get("/properties/search", protect, searchPropertiesOnMap);
router.get("/violations/nearby", protect, getNearbyViolations);
router.get("/violations/clusters", protect, getViolationClusters);

export default router;
