// src/modules/payments/payments.routes.js
// Payment API routes

const express = require("express");
const router = express.Router();

const paymentsController = require("./payments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validateMiddleware = require("../../middlewares/validate.middleware");
const {
  createOrderValidation,
  verifyPaymentValidation,
} = require("./payments.validation");

// ─────────────────────────────────────────
// PUBLIC ROUTE — Razorpay webhook
// MUST be before authMiddleware
// Razorpay calls this directly — no JWT token
// ─────────────────────────────────────────
router.post("/webhook", paymentsController.handleWebhook);

// ─────────────────────────────────────────
// PROTECTED ROUTES — require JWT
// ─────────────────────────────────────────
router.use(authMiddleware);

// POST /api/payments/create-order
// Create a Razorpay order (first step of payment flow)
router.post(
  "/create-order",
  createOrderValidation,
  validateMiddleware,
  paymentsController.createOrder
);

// POST /api/payments/verify
// Verify payment after Razorpay checkout completes
router.post(
  "/verify",
  verifyPaymentValidation,
  validateMiddleware,
  paymentsController.verifyPayment
);

// GET /api/payments/analytics
// Must be before /:id to prevent "analytics" being treated as an id
router.get("/analytics", paymentsController.getPaymentAnalytics);

// GET /api/payments/history
router.get("/history", paymentsController.getPaymentHistory);

// GET /api/payments/:id
router.get("/:id", paymentsController.getPaymentById);

module.exports = router;