import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    violation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Violation",
      required: true,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "NET_BANKING", "CHEQUE", "OTHER"],
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentReference: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    notes: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
paymentSchema.index({ violation: 1 });
paymentSchema.index({ payer: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ receiptNumber: 1 });
paymentSchema.index({ paymentDate: -1 });

export default mongoose.model("Payment", paymentSchema);
