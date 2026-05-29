const budgetExpenseService = require("./budgetExpense.service");
const { sendSuccess } = require("../../utils/apiResponse");

const createExpense = async (req, res, next) => {
  try {
    const expense = await budgetExpenseService.createExpense(req.user.id, req.body);
    return sendSuccess(res, "Expense created successfully.", expense, 201);
  } catch (error) {
    next(error);
  }
};

const getExpensesByUser = async (req, res, next) => {
  try {
    const expenses = await budgetExpenseService.getExpensesByUser(req.user.id, req.params.userId);
    return sendSuccess(res, "Expenses fetched successfully.", expenses);
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await budgetExpenseService.updateExpense(req.user.id, req.params.id, req.body);
    return sendSuccess(res, "Expense updated successfully.", expense);
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await budgetExpenseService.deleteExpense(req.user.id, req.params.id);
    return sendSuccess(res, "Expense deleted successfully.", null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpensesByUser,
  updateExpense,
  deleteExpense,
};
