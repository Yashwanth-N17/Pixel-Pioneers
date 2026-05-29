const express = require("express");
const router = express.Router();

const budgetController = require("./budget.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  budgetPayloadValidation,
  budgetIdParam,
  userIdParam,
} = require("./budget.validation");

router.use(authMiddleware);

router.post("/create", budgetPayloadValidation, validate, budgetController.createBudget);
router.get("/:userId", userIdParam, validate, budgetController.getBudgetsByUser);
router.put("/:id", budgetIdParam, budgetPayloadValidation, validate, budgetController.updateBudget);

module.exports = router;
