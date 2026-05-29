// src/modules/payments/payments.controller.js
// HTTP handlers for payment endpoints

const paymentsService = require("./payments.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const logger = require("../../utils/logger");

// ─────────────────────────────────────────
// POST /api/payments/mock-checkout
// ─────────────────────────────────────────
const processMockCheckout = async (req, res, next) => {
  try {
    const { amount, description, category, shgGroupId, shgTransactionType, repaymentDeadline } = req.body;

    const result = await paymentsService.processMockCheckout(
      req.user.id,
      amount,
      description,
      category,
      shgGroupId,
      shgTransactionType,
      repaymentDeadline
    );

    return sendSuccess(
      res,
      "Mock checkout processed successfully.",
      result,
      201
    );
  } catch (error) {
    logger.error(`[processMockCheckout] Error: ${error.message}`);
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /api/payments/history
// ─────────────────────────────────────────
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
  processMockCheckout,
  getPaymentHistory,
  getPaymentAnalytics,
  getPaymentById,
};