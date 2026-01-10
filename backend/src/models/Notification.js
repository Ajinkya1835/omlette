import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "VIOLATION_REPORTED",
        "VIOLATION_ASSIGNED",
        "VIOLATION_STATUS_CHANGED",
        "PAYMENT_RECEIVED",
        "PAYMENT_DUE",
        "APPEAL_SUBMITTED",
        "APPEAL_REVIEWED",
        "ACCOUNT_APPROVED",
        "ACCOUNT_REJECTED",
        "PROPERTY_APPROVED",
        "PROPERTY_REJECTED",
        "COMMENT_ADDED",
        "SYSTEM_ALERT",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["VIOLATION", "PROPERTY", "PAYMENT", "APPEAL", "USER"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
