// src/modules/payments/payments.controller.js
// HTTP handlers for payment endpoints

const paymentsService = require("./payments.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const logger = require("../../utils/logger");

// ─────────────────────────────────────────
// POST /api/payments/create-order
// ─────────────────────────────────────────
/**
 * Creates a Razorpay order.
 *
 * Request body:
 *   { amount: 500, description: "Groceries", category: "Food" }
 *
 * Response:
 *   { orderId, amount (paise), amountInr, currency, keyId, receipt }
 */
const createOrder = async (req, res, next) => {
  try {
    const { amount, description, category } = req.body;

    const orderData = await paymentsService.createOrder(
      req.user.id,
      amount,
      description,
      category
    );

    return sendSuccess(
      res,
      "Razorpay order created successfully.",
      orderData,
      201
    );
  } catch (error) {
    logger.error(`[createOrder] Error: ${error.message}`);
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /api/payments/verify
// ─────────────────────────────────────────
/**
 * Verifies Razorpay payment after checkout completion.
 *
 * Request body:
 *   {
 *     razorpay_order_id: "order_XXXXX",
 *     razorpay_payment_id: "pay_XXXXX",
 *     razorpay_signature: "HMAC_SIGNATURE"
 *   }
 *
 * Response:
 *   { payment, transaction, alreadyVerified }
 */
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const result = await paymentsService.verifyPayment(
      req.user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    const message = result.alreadyVerified
      ? "Payment was already verified."
      : "Payment verified and transaction recorded successfully.";

    return sendSuccess(res, message, result);
  } catch (error) {
    logger.error(`[verifyPayment] Error: ${error.message}`);
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /api/payments/webhook
// Called by Razorpay server — NO auth middleware
// ─────────────────────────────────────────
/**
 * Handles Razorpay webhook events.
 * Razorpay sends this for payment.captured, payment.failed, order.paid etc.
 *
 * Headers: x-razorpay-signature
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      logger.warn("[WEBHOOK] Missing x-razorpay-signature header");
      return res.status(400).json({ success: false, message: "Missing webhook signature." });
    }

    const result = await paymentsService.handleWebhook(
      req.rawBody,
      signature,
      req.body
    );

    // Always return 200 to Razorpay — even if we don't process the event.
    // Returning non-200 causes Razorpay to retry repeatedly.
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error(`[handleWebhook] Error: ${error.message}`);
    // Return 200 to prevent Razorpay retry storms
    return res.status(200).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────
// GET /api/payments/history
// ─────────────────────────────────────────
/**
 * Returns authenticated user's payment history.
 *
 * Query params (optional): status, startDate, endDate
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const payments = await paymentsService.getPaymentHistory(
      req.user.id,
      filters
    );

    return sendSuccess(
      res,
      "Payment history fetched successfully.",
      payments
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /api/payments/analytics
// ─────────────────────────────────────────
/**
 * Returns payment analytics — totals, category breakdown, monthly summary.
 */
const getPaymentAnalytics = async (req, res, next) => {
  try {
    const analytics = await paymentsService.getPaymentAnalytics(req.user.id);
    return sendSuccess(
      res,
      "Payment analytics fetched successfully.",
      analytics
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /api/payments/:id
// ─────────────────────────────────────────
/**
 * Returns a single payment by its DB id.
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentsService.getPaymentById(
      req.user.id,
      req.params.id
    );
    return sendSuccess(res, "Payment fetched successfully.", payment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getPaymentAnalytics,
  getPaymentById,
};