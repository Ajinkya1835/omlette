import ViolationRule from "../models/ViolationRule.js";

export const matchRule = async ({ category, selectedCode, text, entityType }) => {
  if (selectedCode) {
    return ViolationRule.findOne({ violation_code: selectedCode });
  }

  const tokens = (text || "").toLowerCase().split(/\W+/);

  return ViolationRule.findOne({
    category,
    entity_type: entityType,
    keywords: { $in: tokens }
  });
};
