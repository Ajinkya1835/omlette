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

    const mediaFiles = Array.isArray(req.files)
      ? req.files.map((file) => ({
          path: file.path,
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
export const officerConfirm = async (req, res) => {
  res.json({
    message: "officerConfirm (to be implemented)",
  });
};

export const officerOverride = async (req, res) => {
  res.json({
    message: "officerOverride (to be implemented)",
  });
};
