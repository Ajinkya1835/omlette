// backend/src/routes/propertyRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAllProperties,
  getAllPropertiesForMap,
  getNearbyProperties,
  getPropertyById,
} from "../controllers/propertyController.js";

const router = express.Router();

// Public/protected routes for property viewing
router.get("/", protect, getAllProperties);
router.get("/all", protect, getAllPropertiesForMap);
router.get("/nearby", protect, getNearbyProperties);
router.get("/:id", protect, getPropertyById);

export default router;
