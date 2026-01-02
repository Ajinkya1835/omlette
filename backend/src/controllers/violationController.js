import Violation from "../models/Violation.js";
import ViolationRule from "../models/ViolationRule.js";

/**
 * CREATE VIOLATION (Citizen reports)
 */
export const createViolation = async (req, res) => {
  try {
    const { violationType, description, latitude, longitude } = req.body;

    if (!violationType || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Create base violation
    const violation = await Violation.create({
      reportedBy: req.user._id,
      violationType,
      description,
      location: {
        latitude,
        longitude,
      },
      media: [],
      status: "REPORTED",
    });

    // 2. Match rule (case-insensitive)
    const rule = await ViolationRule.findOne({
      category: { $regex: new RegExp(violationType, "i") },
    });

    // 3. Build system decision
    let decisionData = {
      decision: "REVIEW",
      amount: 0,
      requiresHuman: true,
    };

    if (rule) {
      decisionData = {
        decision: rule.compoundable ? "FINE" : "NOTICE",
        amount:
          rule.severity === "High"
            ? 5000
            : rule.severity === "Medium"
            ? 1000
            : 500,
        requiresHuman: false,
      };
    }

    // 4. Freeze decision snapshot
    violation.decision = {
      decision: decisionData.decision,
      amount: decisionData.amount,
      ruleApplied: rule ? rule.violation_code : null,
      ruleSnapshot: rule
        ? {
            title: rule.title,
            act: rule.act,
            section: rule.section,
            authority: rule.authority,
            severity: rule.severity,
          }
        : null,
      aiConfidence: Number((0.7 + Math.random() * 0.3).toFixed(2)),
      requiresHuman: decisionData.requiresHuman,
    };

    // 5. Automatic status transitions
    violation.status = "AUTO_DECIDED";
    violation.status = "AWAITING_OWNER";

    await violation.save();

    res.status(201).json({
      message: "Violation reported successfully",
      violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET VIOLATIONS (role-based)
 */
export const getViolations = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "CITIZEN") {
      filter.reportedBy = req.user._id;
    }

    const violations = await Violation.find(filter)
      .populate("reportedBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(violations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PERMIT HOLDER ACCEPTS DECISION
 */
export const acceptViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed" });
    }

    // Mock payment success
    violation.status = "PAID";
    await violation.save();

    res.json({
      message: "Decision accepted and fine paid",
      violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PERMIT HOLDER OBJECTS DECISION
 */
export const objectViolation = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "AWAITING_OWNER") {
      return res.status(400).json({ message: "Action not allowed" });
    }

    violation.status = "OBJECTED";
    violation.decision.requiresHuman = true;

    await violation.save();

    res.json({
      message: "Violation objected, sent for officer review",
      violation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OFFICER CONFIRMS SYSTEM DECISION
export const officerConfirm = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Not under review" });
    }

    violation.status = "CLOSED";
    await violation.save();

    res.json({
      message: "System decision confirmed by officer",
      violation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// OFFICER OVERRIDES DECISION
export const officerOverride = async (req, res) => {
  try {
    const { decision, amount } = req.body;

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: "Violation not found" });
    }

    if (violation.status !== "OBJECTED") {
      return res.status(400).json({ message: "Not under review" });
    }

    violation.decision.decision = decision;
    violation.decision.amount = amount;
    violation.status = "CLOSED";

    await violation.save();

    res.json({
      message: "Decision overridden by officer",
      violation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
