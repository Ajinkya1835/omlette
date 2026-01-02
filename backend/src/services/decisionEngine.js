export const decide = ({ rule, pastCount }) => {
  if (!rule) return { decision: "REVIEW", requiresHuman: true };

  let amount = 0;
  if (rule.severity === "Low") amount = 500;
  if (rule.severity === "Medium") amount = 1000;
  if (rule.severity === "High") amount = 5000;

  if (pastCount >= 2) amount *= 2;

  return {
    decision: rule.compoundable ? "FINE" : "NOTICE",
    amount,
    ruleApplied: rule.violation_code,
    requiresHuman: false
  };
};
