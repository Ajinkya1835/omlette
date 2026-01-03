import Violation from "../models/Violation.js";


/* ======================================================
   CREATE VIOLATION (Citizen)
====================================================== */
export const createViolation = async (req, res) => {
  try {
    const violationType = req.body.violationType;
    const description = req.body.description || "";
    const latitude = req.body.latitude
      ? Number(req.body.latitude)
      : null;
    const longitude = req.body.longitude
      ? Number(req.body.longitude)
      : null;

    if (!violationType || latitude === null || longitude === null) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // ✅ FIX: Use 'url' instead of 'path' to match schema
    const mediaFiles = Array.isArray(req.files)
      ? req.files.map((file) => ({
          url: file.path,  // Changed from 'path' to 'url'
          type: file.mimetype.startsWith("image")
            ? "IMAGE"
            : "VIDEO",
        }))
      : [];

    const violation = await Violation.create({
      reportedBy: req.user._id,
      violationType,
      description,
      location: {
        latitude,
        longitude,
      },
      media: mediaFiles,
      status: "AWAITING_OWNER",
    });

    res.status(201).json({
      message: "Violation reported successfully",
      violation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
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
      .sort({ createdAt: -1 })
      .lean(); // 🔑 IMPORTANT: convert to plain JS objects

    // 🛡️ HARD GUARANTEE: only valid objects go out
    const safeViolations = Array.isArray(rawViolations)
      ? rawViolations.filter(
          (v) =>
            v &&
            typeof v === "object" &&
            typeof v.violationType === "string"
        )
      : [];

    res.json(safeViolations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   OWNER ACTIONS (STUBS)
====================================================== */
export const acceptViolation = async (req, res) => {
  res.json({
    message: "acceptViolation (to be implemented)",
  });
};

export const objectViolation = async (req, res) => {
  res.json({
    message: "objectViolation (to be implemented)",
  });
};

/* ======================================================
   OFFICER ACTIONS (STUBS)
====================================================== */
/*export const officerConfirm = async (req, res) => {
  res.json({
    message: "officerConfirm (to be implemented)",
  });
};

export const officerOverride = async (req, res) => {
  res.json({
    message: "officerOverride (to be implemented)",
  });
};




/* ======================================================
   OFFICER: GET OBJECTED VIOLATIONS
====================================================== */
export const getOfficerViolations = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violations = await Violation.find({
      status: "OBJECTED",
    })
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email")
      .lean();

    res.json(violations);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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

    violation.overrideReason = reason || "No reason provided";

    await violation.save();

    res.json({ message: "Violation overridden and closed", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

