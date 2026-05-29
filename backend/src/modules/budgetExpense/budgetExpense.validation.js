const { body, param } = require("express-validator");

const categories = [
  "food",
  "farming",
  "healthcare",
  "education",
  "loan_repayment",
  "transport",
  "utilities",
  "miscellaneous",
];

const expensePayloadValidation = [
  body("budgetId").isUUID().withMessage("budgetId must be a valid UUID."),
  body("category").isIn(categories).withMessage("Invalid expense category."),
  body("amount")
    .notEmpty()
    .withMessage("amount is required.")
    .isFloat({ min: 0 })
    .withMessage("amount must be a non-negative number."),
  body("description").optional({ values: "null" }).isString().withMessage("description must be a string."),
];

const idParam = [param("id").isUUID().withMessage("Expense id must be a valid UUID.")];
const userIdParam = [param("userId").isUUID().withMessage("userId must be a valid UUID.")];

module.exports = {
  expensePayloadValidation,
  idParam,
  userIdParam,
};
