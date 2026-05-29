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
    .optional({ values: "null" })
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
    .optional({ values: "null" })
    .isFloat({ min: 0 }).withMessage("Collateral value must be a positive number."),
];

const budgetPlanValidation = [
  body("income").isFloat({ min: 0 }).withMessage("income must be a non-negative number."),
  body("expenses").isObject().withMessage("expenses must be an object."),
  body("goals").optional({ values: "null" }).isObject().withMessage("goals must be an object."),
];

const emergencyFundValidation = [
  body("monthlyExpenses")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("monthlyExpenses must be a non-negative number."),
  body("expenses")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("expenses must be a non-negative number."),
  body("currentSaved")
    .optional({ values: "null" })
    .isFloat({ min: 0 })
    .withMessage("currentSaved must be a non-negative number."),
  body("reserveMonths")
    .optional({ values: "null" })
    .isInt({ min: 3, max: 6 })
    .withMessage("reserveMonths must be between 3 and 6."),
];

const educationPlanValidation = [
  body("childAge").isInt({ min: 0, max: 25 }).withMessage("childAge must be valid."),
  body("targetAmount").isFloat({ min: 1 }).withMessage("targetAmount is required."),
  body("targetYear").optional({ values: "null" }).isInt({ min: 2026 }).withMessage("targetYear must be valid."),
  body("yearsRemaining").optional({ values: "null" }).isInt({ min: 1 }).withMessage("yearsRemaining must be valid."),
];

const goldPlanValidation = [
  body("savingsAmount").isFloat({ min: 1 }).withMessage("savingsAmount is required."),
];

const cashflowForecastValidation = [
  body("income").isFloat({ min: 0 }).withMessage("income must be non-negative."),
  body("expenses").isFloat({ min: 0 }).withMessage("expenses must be non-negative."),
  body("currentBalance").optional({ values: "null" }).isFloat().withMessage("currentBalance must be numeric."),
];

const seasonalIncomeValidation = [
  body("incomeSources").optional({ values: "null" }).isArray().withMessage("incomeSources must be an array."),
  body("expenses").optional({ values: "null" }).isObject().withMessage("expenses must be an object."),
];

module.exports = {
  financialGuidanceValidation,
  scamDetectionValidation,
  loanAnalysisValidation,
  budgetPlanValidation,
  emergencyFundValidation,
  educationPlanValidation,
  goldPlanValidation,
  cashflowForecastValidation,
  seasonalIncomeValidation,
};
