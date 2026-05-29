// src/modules/payments/payments.routes.js
// Payment API routes

const express = require("express");
const router = express.Router();

const paymentsController = require("./payments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// ─────────────────────────────────────────
// PROTECTED ROUTES — require JWT
// ─────────────────────────────────────────
router.use(authMiddleware);

// POST /api/payments/mock-checkout
// Create a mock payment, auto-sync to ledger, handle late fees, and sync to SHG
router.post("/mock-checkout", paymentsController.processMockCheckout);

// GET /api/payments/analytics
// Must be before /:id to prevent "analytics" being treated as an id
router.get("/analytics", paymentsController.getPaymentAnalytics);

// GET /api/payments/history
router.get("/history", paymentsController.getPaymentHistory);

// GET /api/payments/:id
router.get("/:id", paymentsController.getPaymentById);

module.exports = router;