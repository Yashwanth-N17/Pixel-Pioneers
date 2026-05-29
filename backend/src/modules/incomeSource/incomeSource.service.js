const prisma = require("../../config/db");
const { emitToUser } = require("../../services/socketHub");

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertOwnUser = (requestUserId, targetUserId) => {
  if (requestUserId !== targetUserId) {
    throw makeError("You can only access your own income sources.", 403);
  }
};

const createIncomeSource = async (userId, payload) => {
  const incomeSource = await prisma.incomeSource.create({
    data: {
      userId,
      sourceName: payload.sourceName,
      amount: Number(payload.amount),
      frequency: payload.frequency,
      seasonalFlag: Boolean(payload.seasonalFlag),
      seasonCategory: payload.seasonCategory || null,
    },
  });
  emitToUser(userId, "budget-updated", { type: "income-source-created", incomeSource });
  return incomeSource;
};

const getIncomeSourcesByUser = async (requestUserId, userId) => {
  assertOwnUser(requestUserId, userId);

  return prisma.incomeSource.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const updateIncomeSource = async (userId, id, payload) => {
  const existing = await prisma.incomeSource.findFirst({ where: { id, userId } });
  if (!existing) throw makeError("Income source not found.", 404);

  const incomeSource = await prisma.incomeSource.update({
    where: { id },
    data: {
      sourceName: payload.sourceName,
      amount: Number(payload.amount),
      frequency: payload.frequency,
      seasonalFlag: Boolean(payload.seasonalFlag),
      seasonCategory: payload.seasonCategory || null,
    },
  });
  emitToUser(userId, "budget-updated", { type: "income-source-updated", incomeSource });
  return incomeSource;
};

const deleteIncomeSource = async (userId, id) => {
  const existing = await prisma.incomeSource.findFirst({ where: { id, userId } });
  if (!existing) throw makeError("Income source not found.", 404);

  await prisma.incomeSource.delete({ where: { id } });
  emitToUser(userId, "budget-updated", { type: "income-source-deleted", id });
};

module.exports = {
  createIncomeSource,
  getIncomeSourcesByUser,
  updateIncomeSource,
  deleteIncomeSource,
};
