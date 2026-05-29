// src/modules/profile/profile.validation.js
// Validation rules for all occupation-based profile endpoints

const { body } = require("express-validator");

// ─────────────────────────────────────────
// SHARED USER BASE VALIDATION
// Applied at signup to expand User model fields
// ─────────────────────────────────────────

const baseProfileValidation = [
  body("occupation")
    .notEmpty()
    .withMessage("Occupation is required.")
    .isIn(["farmer", "shop_owner", "tailor", "daily_wage_worker"])
    .withMessage("Invalid occupation type."),

  body("monthlyIncome")
    .notEmpty()
    .withMessage("Monthly income is required.")
    .isFloat({ min: 0 })
    .withMessage("Monthly income must be a positive number."),

  body("monthlyExpenses")
    .notEmpty()
    .withMessage("Monthly expenses are required.")
    .isFloat({ min: 0 })
    .withMessage("Monthly expenses must be a positive number."),

  body("repaymentHabit")
    .optional()
    .isIn([
      "always_on_time",
      "sometimes_late",
      "often_late",
      "defaulted",
      "no_loans_yet",
    ])
    .withMessage("Invalid repayment habit value."),

  body("loanHistory")
    .optional()
    .isArray()
    .withMessage("Loan history must be an array."),

  body("loanHistory.*.lender")
    .optional()
    .isString()
    .withMessage("Lender must be a string."),

  body("loanHistory.*.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Loan amount must be a positive number."),
];

// ─────────────────────────────────────────
// FARMER PROFILE VALIDATION
// ─────────────────────────────────────────

const farmerProfileValidation = [
  ...baseProfileValidation,

  body("crops")
    .notEmpty()
    .withMessage("At least one crop is required.")
    .isArray({ min: 1 })
    .withMessage("Crops must be an array with at least one item."),

  body("crops.*")
    .isString()
    .withMessage("Each crop must be a string."),

  body("inputCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Input cost must be a positive number."),

  body("landArea")
    .optional()
    .isString()
    .withMessage("Land area must be a string."),

  body("irrigationType")
    .optional()
    .isIn(["rain-fed", "irrigated", "mixed"])
    .withMessage("Invalid irrigation type."),

  body("rtcVerified")
    .optional()
    .isBoolean()
    .withMessage("rtcVerified must be a boolean."),

  body("rtcRecordId")
    .optional()
    .isUUID()
    .withMessage("rtcRecordId must be a valid UUID."),
];

// ─────────────────────────────────────────
// SHOP PROFILE VALIDATION
// ─────────────────────────────────────────

const shopProfileValidation = [
  ...baseProfileValidation,

  body("shopName")
    .optional()
    .isString()
    .withMessage("Shop name must be a string."),

  body("investmentAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Investment amount must be a positive number."),

  body("supplierCredit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Supplier credit must be a positive number."),

  body("inventoryCycle")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Inventory cycle must be a positive integer (days)."),

  body("monthlyRevenue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly revenue must be a positive number."),
];

// ─────────────────────────────────────────
// TAILOR PROFILE VALIDATION
// ─────────────────────────────────────────

const tailorProfileValidation = [
  ...baseProfileValidation,

  body("machineryCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Machinery count must be a non-negative integer."),

  body("weeklyStitchCapacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Weekly stitch capacity must be a non-negative integer."),

  body("advanceDeposits")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Advance deposits must be a positive number."),

  body("workType")
    .optional()
    .isIn(["blouse", "full_suit", "alterations", "all"])
    .withMessage("Invalid work type."),
];

// ─────────────────────────────────────────
// GENERIC PROFILE VALIDATION (Daily Wage Worker)
// ─────────────────────────────────────────

const genericProfileValidation = [
  ...baseProfileValidation,

  body("employmentStability")
    .optional()
    .isIn(["stable", "seasonal", "irregular"])
    .withMessage("Invalid employment stability value."),

  body("workingDaysPerMonth")
    .optional()
    .isInt({ min: 0, max: 31 })
    .withMessage("Working days must be between 0 and 31."),

  body("paymentChannel")
    .optional()
    .isIn(["cash", "upi", "bank_transfer"])
    .withMessage("Invalid payment channel."),

  body("employer")
    .optional()
    .isString()
    .withMessage("Employer must be a string."),

  body("workType")
    .optional()
    .isIn(["construction", "domestic", "agriculture", "other"])
    .withMessage("Invalid work type."),
];

// ─────────────────────────────────────────
// UPDATE PROFILE VALIDATION
// ─────────────────────────────────────────

const updateProfileValidation = [
  body("name").optional().isString().withMessage("Name must be a string."),
  body("phone").optional().isString().withMessage("Phone must be a string."),
  body("language")
    .optional()
    .isIn(["en", "hi", "kn", "te", "ta", "mr"])
    .withMessage("Unsupported language code."),
  body("monthlyIncome")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly income must be a positive number."),
  body("monthlyExpenses")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monthly expenses must be a positive number."),
  body("businessDetails")
    .optional()
    .isObject()
    .withMessage("Business details must be an object."),
  body("preferences")
    .optional()
    .isObject()
    .withMessage("Preferences must be an object."),
];

module.exports = {
  farmerProfileValidation,
  shopProfileValidation,
  tailorProfileValidation,
  genericProfileValidation,
  updateProfileValidation,
};