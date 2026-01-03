// backend/src/controllers/ownerController.js
import Violation from "../models/Violation.js";

// Get violations awaiting owner response
export const getOwnerViolations = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violations = await Violation.find({
      status: "AWAITING_OWNER",
    })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(violations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner accepts the violation
export const acceptViolation = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed on this violation" });
    }

    if (violation.decision?.decision === "FINE") {
      violation.status = "PAID";
    } else {
      violation.status = "CLOSED";
    }

    await violation.save();

    res.json({ message: "Violation accepted", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Owner objects to the violation
export const objectViolation = async (req, res) => {
  try {
    if (req.user.role !== "PERMIT_HOLDER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Objection reason is required" });
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed on this violation" });
    }

    violation.status = "OBJECTED";
    violation.decision.requiresHuman = true;
    violation.decision.overrideReason = reason;

    await violation.save();

    res.json({ message: "Violation objected successfully", violation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};