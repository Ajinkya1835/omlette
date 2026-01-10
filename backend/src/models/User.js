import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    role: {
      type: String,
      enum: ["CITIZEN", "OFFICER", "PERMIT_HOLDER", "ADMIN"],
      default: "CITIZEN",
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, approved: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);
