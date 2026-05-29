const budgetService = require("./budget.service");
const { sendSuccess } = require("../../utils/apiResponse");

const createBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.createBudget(req.user.id, req.body);
    return sendSuccess(res, "Budget created successfully.", budget, 201);
  } catch (error) {
    next(error);
  }
};

const getBudgetsByUser = async (req, res, next) => {
  try {
    const budgets = await budgetService.getBudgetsByUser(req.user.id, req.params.userId);
    return sendSuccess(res, "Budgets fetched successfully.", budgets);
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
    return sendSuccess(res, "Budget updated successfully.", budget);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgetsByUser,
  updateBudget,
};
