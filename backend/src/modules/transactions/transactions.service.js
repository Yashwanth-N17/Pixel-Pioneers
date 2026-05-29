// src/modules/transactions/transactions.service.js
// CRUD operations for transactions

const prisma = require("../../config/db");

// ─────────────────────────────────────────
// Categories per occupation for ledger queries
// ─────────────────────────────────────────
const LEDGER_CATEGORIES = {
  FARMER:     ["Crop Sale", "Input Cost"],
  SHOP_OWNER: ["Udhar", "Stock"],
  TAILOR:     ["Order", "Delivery"],
  DAILY_WAGE: ["Shift", "Payment Due"],
};

/**
 * Add a new transaction (ledgerMeta is stored if provided)
 */
const addTransaction = async (userId, { amount, type, category, note, date, ledgerMeta }) => {
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount:     parseFloat(amount),
      type,
      category,
      note:       note || null,
      date:       date ? new Date(date) : new Date(),
      ledgerMeta: ledgerMeta ?? null,
    },
  });

  return transaction;
};

/**
 * Get all transactions for a user
 * Supports optional filters: type, category, startDate, endDate
 */
const getAllTransactions = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = { contains: filters.category, mode: "insensitive" };

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate)   where.date.lte = new Date(filters.endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return transactions;
};

/**
 * Get all ledger entries for a specific occupation.
 * Returns entries matching the occupation's category set,
 * plus a grouped breakdown by category.
 */
const getLedgerEntries = async (userId, occupation) => {
  const categories = LEDGER_CATEGORIES[occupation];
  if (!categories) {
    const err = new Error(`Unknown occupation: ${occupation}`);
    err.statusCode = 400;
    throw err;
  }

  const entries = await prisma.transaction.findMany({
    where: {
      userId,
      category: { in: categories },
    },
    orderBy: { date: "desc" },
  });

  // Group by category for easy consumption by the frontend
  const grouped = {};
  for (const cat of categories) {
    grouped[cat] = entries.filter((e) => e.category === cat);
  }

  return { entries, grouped };
};

/**
 * Get a single transaction by ID (must belong to user)
 */
const getTransactionById = async (userId, transactionId) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  return transaction;
};

/**
 * Update a transaction
 */
const updateTransaction = async (userId, transactionId, updateData) => {
  // First check ownership
  await getTransactionById(userId, transactionId);

  const allowedFields = ["amount", "type", "category", "note", "date", "ledgerMeta"];
  const filteredData = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      filteredData[field] =
        field === "amount" ? parseFloat(updateData[field])
        : field === "date" ? new Date(updateData[field])
        : updateData[field];
    }
  });

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: filteredData,
  });

  return updated;
};

/**
 * Delete a transaction
 */
const deleteTransaction = async (userId, transactionId) => {
  // First check ownership
  await getTransactionById(userId, transactionId);

  await prisma.transaction.delete({ where: { id: transactionId } });

  return { deleted: true };
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getLedgerEntries,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};