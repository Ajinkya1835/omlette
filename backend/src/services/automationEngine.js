import ViolationRule from "../models/ViolationRule.js";

/**
 * Apply automation rules on a violation
 */
export async function applyAutomation(violation) {
  const rule = await ViolationRule.findOne({
    violation_code: violation.violationType,
  }).lean();

  // If rule not found → human review
  if (!rule) {
    return {
      status: "UNDER_REVIEW",
      decision: {
        decision: "REVIEW",
        requiresHuman: true,
        aiConfidence: 0,
      },
    };
  }

  // Base decision snapshot (IMMUTABLE)
  const decisionSnapshot = {
    ruleApplied: rule.violation_code,
    ruleSnapshot: {
      title: rule.title,
      act: rule.act,
      section: rule.section,
      authority: rule.authority,
      severity: rule.severity,
    },
    aiConfidence: 0.95, // deterministic for now
  };

  // 🚦 Decision logic
  if (rule.severity === "High" || rule.compoundable === false) {
    return {
      status: "AWAITING_OWNER",
      decision: {
        ...decisionSnapshot,
        decision: "REVIEW",
        requiresHuman: true,
      },
    };
  }

  if (rule.severity === "Medium") {
    return {
      status: "AUTO_DECIDED",
      decision: {
        ...decisionSnapshot,
        decision: "NOTICE",
        amount: 0,
        requiresHuman: false,
      },
    };
  }

  // Low + compoundable → Auto fine
  return {
    status: "AUTO_DECIDED",
    decision: {
      ...decisionSnapshot,
      decision: "FINE",
      amount: 500, // default fine (can be rule-based later)
      requiresHuman: false,
    },
  };
}
