import Payment from "../models/Payment.js";
import Violation from "../models/Violation.js";

/**
 * Create a new payment
 * @param {Object} paymentData - Payment details
 */
export const createPayment = async (paymentData) => {
  try {
    const { violationId, payerId, amount, paymentMethod, transactionId, paymentReference, notes } = paymentData;

    // Verify violation exists
    const violation = await Violation.findById(violationId);
    if (!violation) {
      throw new Error("Violation not found");
    }

    // Create payment
    const payment = await Payment.create({
      violation: violationId,
      payer: payerId,
      amount,
      paymentMethod,
      transactionId,
      paymentReference,
      notes,
      status: "PENDING",
    });

    return payment;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

/**
 * Process a payment (mark as completed)
 * @param {ObjectId} paymentId - Payment ID
 * @param {ObjectId} processedBy - Officer ID who processed it
 * @param {String} receiptNumber - Generated receipt number
 */
export const processPayment = async (paymentId, processedBy, receiptNumber) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.status = "COMPLETED";
    payment.processedBy = processedBy;
    payment.receiptNumber = receiptNumber;
    payment.paymentDate = new Date();

    await payment.save();

    // Update violation status to PAID
    await Violation.findByIdAndUpdate(payment.violation, {
      status: "PAID",
    });

    return payment;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

/**
 * Get payments for a user
 * @param {ObjectId} userId - User ID
 */
export const getUserPayments = async (userId) => {
  try {
    const payments = await Payment.find({ payer: userId })
      .populate("violation", "violationType description decision.amount")
      .sort({ createdAt: -1 })
      .lean();
    return payments;
  } catch (error) {
    console.error("Error fetching user payments:", error);
    throw error;
  }
};

/**
 * Get payments for a violation
 * @param {ObjectId} violationId - Violation ID
 */
export const getViolationPayments = async (violationId) => {
  try {
    const payments = await Payment.find({ violation: violationId })
      .populate("payer", "name email")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return payments;
  } catch (error) {
    console.error("Error fetching violation payments:", error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param {ObjectId} paymentId - Payment ID
 * @param {Number} refundAmount - Amount to refund
 * @param {String} refundReason - Reason for refund
 */
export const refundPayment = async (paymentId, refundAmount, refundReason) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "COMPLETED") {
      throw new Error("Only completed payments can be refunded");
    }

    payment.status = "REFUNDED";
    payment.refundAmount = refundAmount;
    payment.refundDate = new Date();
    payment.refundReason = refundReason;

    await payment.save();
    return payment;
  } catch (error) {
    console.error("Error refunding payment:", error);
    throw error;
  }
};
