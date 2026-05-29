// src/modules/ai/ai.validation.js
// Validation rules for AI endpoints

const { body } = require("express-validator");

// Unchanged
const financialGuidanceValidation = [
  body("query")
    .trim()
    .notEmpty()
    .withMessage("Query text is required.")
    .isLength({ min: 5, max: 1000 })
    .withMessage("Query must be between 5 and 1000 characters."),

  body("language")
    .optional()
    .isIn(["en", "hi", "kn", "te", "ta", "mr"])
    .withMessage("Unsupported language code."),
];

// Unchanged
const scamDetectionValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message text is required.")
    .isLength({ min: 5, max: 2000 })
    .withMessage("Message must be between 5 and 2000 characters."),
];

// Upgraded — matches new ArthScore loan analysis inputs
const loanAnalysisValidation = [
  body("requestedLoanAmount")
    .notEmpty().withMessage("Requested loan amount is required.")
    .isFloat({ min: 1000 }).withMessage("Minimum loan amount is ₹1,000."),

  body("expectedInterestRate")
    .notEmpty().withMessage("Expected interest rate is required.")
    .isFloat({ min: 0, max: 100 }).withMessage("Interest rate must be between 0 and 100."),

  body("tenureMonths")
    .notEmpty().withMessage("Tenure in months is required.")
    .isInt({ min: 1, max: 360 }).withMessage("Tenure must be between 1 and 360 months."),

  body("loanPurpose")
    .notEmpty().withMessage("Loan purpose is required.")
    .isIn([
      "WORKING_CAPITAL", "AGRICULTURE", "EQUIPMENT_PURCHASE",
      "HOME_IMPROVEMENT", "EDUCATION", "MEDICAL",
      "BUSINESS_EXPANSION", "OTHER",
    ]).withMessage("Invalid loan purpose."),

  body("collateralValue")
    .optional()
    .isFloat({ min: 0 }).withMessage("Collateral value must be a positive number."),
];

module.exports = {
  financialGuidanceValidation,
  scamDetectionValidation,
  loanAnalysisValidation,
};