const prisma = require("../../config/db");
const { emitToUser } = require("../../services/socketHub");

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertOwnUser = (requestUserId, targetUserId) => {
  if (requestUserId !== targetUserId) {
    throw makeError("You can only access your own expenses.", 403);
  }
};

const ensureBudget = async (userId, budgetId) => {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) throw makeError("Budget not found.", 404);
  return budget;
};

const createExpense = async (userId, payload) => {
  await ensureBudget(userId, payload.budgetId);

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        budgetId: payload.budgetId,
        category: payload.category,
        amount: Number(payload.amount),
        description: payload.description || null,
      },
    });

    await tx.budget.update({
      where: { id: payload.budgetId },
      data: { totalExpenses: { increment: expense.amount } },
    });

    emitToUser(userId, "budget-updated", { type: "expense-created", expense });
    return expense;
  });
};

const getExpensesByUser = async (requestUserId, userId) => {
  assertOwnUser(requestUserId, userId);

  return prisma.expense.findMany({
    where: { budget: { userId } },
    include: { budget: { select: { id: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateExpense = async (userId, id, payload) => {
  const existing = await prisma.expense.findFirst({
    where: { id, budget: { userId } },
  });
  if (!existing) throw makeError("Expense not found.", 404);

  return prisma.$transaction(async (tx) => {
    const nextAmount = Number(payload.amount);
    const updated = await tx.expense.update({
      where: { id },
      data: {
        budgetId: payload.budgetId,
        category: payload.category,
        amount: nextAmount,
        description: payload.description || null,
      },
    });

    await tx.budget.update({
      where: { id: existing.budgetId },
      data: { totalExpenses: { decrement: existing.amount } },
    });
    await tx.budget.update({
      where: { id: updated.budgetId },
      data: { totalExpenses: { increment: updated.amount } },
    });

    emitToUser(userId, "budget-updated", { type: "expense-updated", expense: updated });
    return updated;
  });
};

const deleteExpense = async (userId, id) => {
  const existing = await prisma.expense.findFirst({
    where: { id, budget: { userId } },
  });
  if (!existing) throw makeError("Expense not found.", 404);

  await prisma.$transaction(async (tx) => {
    await tx.expense.delete({ where: { id } });
    await tx.budget.update({
      where: { id: existing.budgetId },
      data: { totalExpenses: { decrement: existing.amount } },
    });
  });
  emitToUser(userId, "budget-updated", { type: "expense-deleted", id });
};

module.exports = {
  createExpense,
  getExpensesByUser,
  updateExpense,
  deleteExpense,
};
