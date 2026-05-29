// src/modules/payments/payments.validation.js
// Input validation rules for payment endpoints

const { body } = require("express-validator");

// ── Create Order Validation ──────────────
const createOrderValidation = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required.")
    .isFloat({ min: 1 })
    .withMessage("Amount must be at least ₹1."),

  body("description")
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage("Description must be a string under 255 characters."),

  body("category")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Category must be a string under 100 characters."),
];

// ── Verify Payment Validation ────────────
const verifyPaymentValidation = [
  body("razorpay_order_id")
    .notEmpty()
    .withMessage("razorpay_order_id is required."),

  body("razorpay_payment_id")
    .notEmpty()
    .withMessage("razorpay_payment_id is required."),

  body("razorpay_signature")
    .notEmpty()
    .withMessage("razorpay_signature is required."),
];

module.exports = {
  createOrderValidation,
  verifyPaymentValidation,
};