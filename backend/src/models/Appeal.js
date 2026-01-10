import mongoose from "mongoose";

const appealSchema = new mongoose.Schema(
  {
    violation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Violation",
      required: true,
    },
    appellant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    evidence: [
      {
        url: {
          type: String,
        },
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO", "DOCUMENT"],
        },
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewDate: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
    originalAmount: {
      type: Number,
    },
    revisedAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Index for faster queries
appealSchema.index({ violation: 1, appellant: 1 });
appealSchema.index({ status: 1 });
appealSchema.index({ createdAt: -1 });

export default mongoose.model("Appeal", appealSchema);
