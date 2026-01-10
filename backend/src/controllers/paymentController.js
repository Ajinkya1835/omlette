import {
  createPayment,
  processPayment,
  getUserPayments,
  getViolationPayments,
  refundPayment,
} from "../services/paymentService.js";

/**
 * Create a new payment
 * POST /api/payments
 */
export const makePayment = async (req, res) => {
  try {
    const { violationId, amount, paymentMethod, transactionId, paymentReference, notes } = req.body;

    if (!violationId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Violation ID, amount, and payment method are required" });
    }

    const payment = await createPayment({
      violationId,
      payerId: req.user._id,
      amount,
      paymentMethod,
      transactionId,
      paymentReference,
      notes,
    });

    res.status(201).json({
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Error making payment:", error);
    res.status(500).json({ message: error.message || "Failed to create payment" });
  }
};

/**
 * Process a payment (Officer only)
 * PUT /api/payments/:id/process
 */
export const completePayment = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { receiptNumber } = req.body;
    if (!receiptNumber) {
      return res.status(400).json({ message: "Receipt number is required" });
    }

    const payment = await processPayment(req.params.id, req.user._id, receiptNumber);

    res.json({
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: error.message || "Failed to process payment" });
  }
};

/**
 * Get user's payment history
 * GET /api/payments/my-payments
 */
export const getMyPayments = async (req, res) => {
  try {
    const payments = await getUserPayments(req.user._id);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: error.message || "Failed to fetch payments" });
  }
};

/**
 * Get payments for a specific violation
 * GET /api/payments/violation/:violationId
 */
export const getPaymentsByViolation = async (req, res) => {
  try {
    const payments = await getViolationPayments(req.params.violationId);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching violation payments:", error);
    res.status(500).json({ message: error.message || "Failed to fetch payments" });
  }
};

/**
 * Refund a payment (Officer only)
 * PUT /api/payments/:id/refund
 */
export const refundPaymentController = async (req, res) => {
  try {
    if (req.user.role !== "OFFICER") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { refundAmount, refundReason } = req.body;
    if (!refundAmount || !refundReason) {
      return res.status(400).json({ message: "Refund amount and reason are required" });
    }

    const payment = await refundPayment(req.params.id, refundAmount, refundReason);

    res.json({
      message: "Payment refunded successfully",
      payment,
    });
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ message: error.message || "Failed to refund payment" });
  }
};
