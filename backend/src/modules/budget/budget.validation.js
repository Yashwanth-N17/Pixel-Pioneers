const { body, param } = require("express-validator");

const budgetPayloadValidation = [
  body("totalIncome")
    .notEmpty()
    .withMessage("totalIncome is required.")
    .isFloat({ min: 0 })
    .withMessage("totalIncome must be a non-negative number."),
  body("totalExpenses")
    .notEmpty()
    .withMessage("totalExpenses is required.")
    .isFloat({ min: 0 })
    .withMessage("totalExpenses must be a non-negative number."),
  body("recommendedSavings")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("recommendedSavings must be a non-negative number."),
  body("goals").optional().isObject().withMessage("goals must be an object."),
  body("seasonalFlags")
    .optional()
    .isObject()
    .withMessage("seasonalFlags must be an object."),
];

const budgetIdParam = [
  param("id").isUUID().withMessage("Budget id must be a valid UUID."),
];

const userIdParam = [
  param("userId").isUUID().withMessage("userId must be a valid UUID."),
];

module.exports = {
  budgetPayloadValidation,
  budgetIdParam,
  userIdParam,
};
