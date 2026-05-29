// src/modules/dashboard/dashboard.service.js
// Aggregates financial summary data for the dashboard

const prisma = require("../../config/db");

/**
 * Get complete dashboard data for a user
 */
const getDashboardData = async (userId) => {
  // Aggregate totals by transaction type
  const aggregates = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Build totals map
  const totals = { income: 0, expense: 0, saving: 0 };
  aggregates.forEach(({ type, _sum }) => {
    totals[type] = _sum.amount || 0;
  });

  // Net balance
  const netBalance = totals.income - totals.expense - totals.saving;

  // Recent 10 transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 10,
  });

  // Monthly breakdown (current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyAggregates = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  const monthly = { income: 0, expense: 0, saving: 0 };
  monthlyAggregates.forEach(({ type, _sum }) => {
    monthly[type] = _sum.amount || 0;
  });

  // Financial summary text
  const financialSummary = generateFinancialSummary(totals, netBalance, monthly);

  return {
    totalIncome: totals.income,
    totalExpenses: totals.expense,
    totalSavings: totals.saving,
    netBalance,
    monthly,
    recentTransactions,
    financialSummary,
  };
};

/**
 * Simple text-based financial summary
 */
const generateFinancialSummary = (totals, netBalance, monthly) => {
  const savingsRate =
    totals.income > 0
      ? (((totals.saving / totals.income) * 100).toFixed(1))
      : 0;

  let status = "stable";
  if (netBalance < 0) status = "deficit";
  else if (parseFloat(savingsRate) >= 20) status = "healthy";

  return {
    status,
    savingsRate: `${savingsRate}%`,
    message:
      status === "healthy"
        ? "Great job! You are saving well this month."
        : status === "deficit"
        ? "Your expenses exceed income. Consider reducing spending."
        : "Your finances are stable. Try to increase savings.",
  };
};

module.exports = { getDashboardData };