// backend/src/controllers/violationController.js
import Violation from "../models/Violation.js";
import Property from "../models/Property.js";

/* ======================================================
   CREATE VIOLATION (Citizen)
====================================================== */
export const createViolation = async (req, res) => {
  try {
    const violationType = req.body.violationType;
    const description = req.body.description || "";
    const relatedProperty = req.body.relatedProperty || null;
    const latitude = req.body.latitude ? Number(req.body.latitude) : null;
    const longitude = req.body.longitude ? Number(req.body.longitude) : null;

    // ✅ Validation
    if (!violationType) {
      return res.status(400).json({ message: "Violation type is required" });
    }

    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Valid location coordinates are required" });
    }

    // ✅ Validate property if provided
    if (relatedProperty) {
      const property = await Property.findById(relatedProperty);
      if (!property) {
        return res.status(400).json({ message: "Property not found" });
      }
      if (property.status !== "ACTIVE") {
        return res.status(400).json({ message: "Property is not active" });
      }
    }

    // ✅ Process media files
    const mediaFiles = Array.isArray(req.files)
      ? req.files.map((file) => ({
          url: file.path,
          type: file.mimetype.startsWith("image") ? "IMAGE" : "VIDEO",
        }))
      : [];

    console.log("Creating violation with media:", JSON.stringify(mediaFiles));

    // ✅ Create violation
    const violation = await Violation.create({
      reportedBy: req.user._id,
      violationType,
      description,
      relatedProperty: relatedProperty || undefined,
      location: { latitude, longitude },
      locationGeo: {
        type: "Point",
        coordinates: [longitude, latitude], // [lng, lat] order
      },
      media: mediaFiles,
      status: "AWAITING_OWNER",
    });

    res.status(201).json({
      message: "Violation reported successfully",
      violation,
    });
  } catch (error) {
    console.error("Error creating violation:", error);
    res.status(500).json({
      message: error.message || "Failed to create violation",
    });
  }
};

/* ======================================================
   GET VIOLATIONS (SANITIZED)
====================================================== */
export const getViolations = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "CITIZEN") {
      filter.reportedBy = req.user._id;
    }

    const rawViolations = await Violation.find(filter)
      .populate({
        path: "relatedProperty",
        select: "propertyName propertyType address latitude longitude owner",
        populate: {
          path: "owner",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Sanitize violations
    const safeViolations = Array.isArray(rawViolations)
      ? rawViolations.filter(
          (v) => v && typeof v === "object" && typeof v.violationType === "string"
        )
      : [];

    res.json(safeViolations);
  } catch (error) {
    console.error("Error fetching violations:", error);
    res.status(500).json({ message: error.message || "Failed to fetch violations" });
  }
};

/* ======================================================
   OWNER ACTIONS (STUBS)
====================================================== */
export const acceptViolation = async (req, res) => {
  res.json({ message: "acceptViolation (to be implemented)" });
};

export const objectViolation = async (req, res) => {
  res.json({ message: "objectViolation (to be implemented)" });
};

/* ======================================================
   OFFICER: GET OBJECTED VIOLATIONS
====================================================== */
export const getOfficerViolations = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violations = await Violation.find({ status: "OBJECTED" })
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email")
      .lean();

    res.json(violations);
  } catch (error) {
    console.error("Error fetching officer violations:", error);
    res.status(500).json({ message: error.message || "Failed to fetch violations" });
  }
};

/* ======================================================
   OFFICER: CONFIRM VIOLATION
====================================================== */
export const officerConfirm = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    violation.status = "CLOSED";
    violation.decision = {
      ...violation.decision,
      decision: "CONFIRMED",
      requiresHuman: true,
    };

    await violation.save();

    res.json({ message: "Violation confirmed and closed", violation });
  } catch (error) {
    console.error("Error confirming violation:", error);
    res.status(500).json({ message: error.message || "Failed to confirm violation" });
  }
};

/* ======================================================
   OFFICER: OVERRIDE VIOLATION
====================================================== */
export const officerOverride = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Override reason is required" });
    }

    const violation = await Violation.findById(req.params.id);
    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    violation.status = "CLOSED";
    violation.decision = {
      ...violation.decision,
      decision: "OVERRIDDEN",
      requiresHuman: true,
    };
    violation.overrideReason = reason;

    await violation.save();

    res.json({ message: "Violation overridden and closed", violation });
  } catch (error) {
    console.error("Error overriding violation:", error);
    res.status(500).json({ message: error.message || "Failed to override violation" });
  }
};