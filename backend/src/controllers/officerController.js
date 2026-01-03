// backend/src/controllers/officerController.js
import Violation from "../models/Violation.js";
import User from "../models/User.js";

export const getObjectedViolations = async (req, res) => {
  try {
    const violations = await Violation.find({ status: "OBJECTED" })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(violations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Only objected violations can be confirmed" });
    }

    violation.status = "CLOSED";
    violation.decision.decision = "CONFIRMED";
    violation.decision.requiresHuman = true;

    await violation.save();

    res.json({ message: "Violation confirmed", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const overrideViolation = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Override reason is required" });
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Only objected violations can be overridden" });
    }

    violation.status = "CLOSED";
    violation.decision.decision = "OVERRIDDEN";
    violation.decision.requiresHuman = true;
    violation.decision.overrideReason = reason;
    violation.decision.amount = 0;

    await violation.save();

    res.json({ message: "Violation overridden", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};