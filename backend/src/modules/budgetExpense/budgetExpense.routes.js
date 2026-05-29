const express = require("express");
const router = express.Router();

const budgetExpenseController = require("./budgetExpense.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  expensePayloadValidation,
  idParam,
  userIdParam,
} = require("./budgetExpense.validation");

router.use(authMiddleware);

router.post("/", expensePayloadValidation, validate, budgetExpenseController.createExpense);
router.get("/:userId", userIdParam, validate, budgetExpenseController.getExpensesByUser);
router.put("/:id", idParam, expensePayloadValidation, validate, budgetExpenseController.updateExpense);
router.delete("/:id", idParam, validate, budgetExpenseController.deleteExpense);

module.exports = router;
