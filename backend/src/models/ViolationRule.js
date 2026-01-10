import mongoose from "mongoose";

const violationRuleSchema = new mongoose.Schema(
  {
    violation_code: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    entity_type: [{ type: String }], // Shop, Industry, Farm
    act: String,
    section: String,
    authority: String,
    severity: { type: String, enum: ["Low", "Medium", "High"], required: true },
    compoundable: { type: Boolean, default: true },
    description: String,
    keywords: [String], // for auto-suggest
  },
  { timestamps: true }
);

// Indexes for faster queries
violationRuleSchema.index({ violation_code: 1 });
violationRuleSchema.index({ category: 1, severity: 1 });
violationRuleSchema.index({ keywords: 1 });

export default mongoose.model("ViolationRule", violationRuleSchema);
