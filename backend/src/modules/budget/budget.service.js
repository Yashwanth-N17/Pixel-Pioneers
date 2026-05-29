const prisma = require("../../config/db");
const { emitToUser } = require("../../services/socketHub");

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertOwnUser = (requestUserId, targetUserId) => {
  if (requestUserId !== targetUserId) {
    throw makeError("You can only access your own budget data.", 403);
  }
};

const createBudget = async (userId, payload) => {
  const totalIncome = Number(payload.totalIncome);
  const totalExpenses = Number(payload.totalExpenses);
  const recommendedSavings =
    payload.recommendedSavings === undefined
      ? Math.max(0, totalIncome - totalExpenses)
      : Number(payload.recommendedSavings);

  const budget = await prisma.budget.create({
    data: {
      userId,
      totalIncome,
      totalExpenses,
      recommendedSavings,
      goals: payload.goals || {},
      seasonalFlags: payload.seasonalFlags || {},
    },
    include: { expenses: true },
  });
  emitToUser(userId, "budget-updated", { type: "budget-created", budget });
  return budget;
};

const getBudgetsByUser = async (requestUserId, userId) => {
  assertOwnUser(requestUserId, userId);

  return prisma.budget.findMany({
    where: { userId },
    include: { expenses: true },
    orderBy: { createdAt: "desc" },
  });
};

const updateBudget = async (userId, budgetId, payload) => {
  const existing = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  });

  if (!existing) throw makeError("Budget not found.", 404);

  const totalIncome =
    payload.totalIncome === undefined ? existing.totalIncome : Number(payload.totalIncome);
  const totalExpenses =
    payload.totalExpenses === undefined ? existing.totalExpenses : Number(payload.totalExpenses);

  const budget = await prisma.budget.update({
    where: { id: budgetId },
    data: {
      totalIncome,
      totalExpenses,
      recommendedSavings:
        payload.recommendedSavings === undefined
          ? Math.max(0, totalIncome - totalExpenses)
          : Number(payload.recommendedSavings),
      goals: payload.goals === undefined ? existing.goals : payload.goals,
      seasonalFlags:
        payload.seasonalFlags === undefined ? existing.seasonalFlags : payload.seasonalFlags,
    },
    include: { expenses: true },
  });
  emitToUser(userId, "budget-updated", { type: "budget-updated", budget });
  return budget;
};

module.exports = {
  createBudget,
  getBudgetsByUser,
  updateBudget,
};
