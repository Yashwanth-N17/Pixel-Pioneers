const prisma = require("../../config/db");
const aiClient = require("../../services/aiClient");
const { emitToUser } = require("../../services/socketHub");

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const localBudgetPlan = ({ income = 0, expenses = {}, goals = {} }) => {
  const totalIncome = toNumber(income);
  const expenseEntries = Array.isArray(expenses)
    ? expenses
    : Object.entries(expenses).map(([category, amount]) => ({ category, amount }));
  const totalExpenses = expenseEntries.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const recommendedSavings = Math.max(0, Math.round(totalIncome * 0.2));
  const availableSavings = Math.max(0, totalIncome - totalExpenses);
  const warnings = [];

  if (totalExpenses > totalIncome) warnings.push("Expenses are higher than income.");
  if (availableSavings < recommendedSavings) warnings.push("Savings are below the recommended level.");

  return {
    recommendedSavings,
    budgetBreakdown: {
      essentials: Math.round(totalIncome * 0.55),
      farmingOrBusiness: Math.round(totalIncome * 0.2),
      savings: recommendedSavings,
      flexible: Math.max(0, Math.round(totalIncome * 0.05)),
    },
    warnings,
    recommendations: [
      "Keep savings aside immediately after income arrives.",
      "Limit flexible spending during low-income weeks.",
      goals.education ? "Protect education savings from daily expenses." : "Add one clear savings goal.",
    ],
    suggestedCategoryLimits: {
      food: Math.round(totalIncome * 0.25),
      farming: Math.round(totalIncome * 0.2),
      healthcare: Math.round(totalIncome * 0.08),
      education: Math.round(totalIncome * 0.1),
      loan_repayment: Math.round(totalIncome * 0.15),
      transport: Math.round(totalIncome * 0.07),
      utilities: Math.round(totalIncome * 0.05),
      miscellaneous: Math.round(totalIncome * 0.1),
    },
  };
};

const postToAI = async (path, payload, fallback) => {
  try {
    return await aiClient.post(path, payload);
  } catch {
    return fallback(payload);
  }
};

const budgetPlan = async (userId, payload) => {
  const result = await postToAI("/budget-plan", payload, localBudgetPlan);
  emitToUser(userId, "ai-analysis-complete", { type: "budget-plan", result });
  return result;
};

const emergencyFund = async (userId, payload) => {
  const monthlyExpenses = toNumber(payload.monthlyExpenses || payload.expenses);
  const currentSaved = toNumber(payload.currentSaved);
  const months = Math.min(6, Math.max(3, toNumber(payload.reserveMonths, 6)));
  const fallback = () => {
    const reserveTarget = Math.round(monthlyExpenses * months);
    const monthlySavingsTarget = Math.max(
      0,
      Math.ceil((reserveTarget - currentSaved) / Math.max(1, toNumber(payload.monthsToBuild, 12)))
    );
    return {
      reserveTarget,
      monthlySavingsTarget,
      recommendations: ["Build 3-6 months of expenses before risky purchases."],
      warnings: currentSaved < monthlyExpenses ? ["Emergency fund is below one month expenses."] : [],
    };
  };

  const result = await postToAI("/emergency-fund", payload, fallback);
  await prisma.emergencyFund.create({
    data: {
      userId,
      targetAmount: toNumber(result.reserveTarget || result.targetAmount),
      currentSaved,
      monthlyTarget: toNumber(result.monthlySavingsTarget || result.monthlyTarget),
    },
  });
  emitToUser(userId, "ai-analysis-complete", { type: "emergency-fund", result });
  return result;
};

const educationPlan = async (userId, payload) => {
  const fallback = () => {
    const targetAmount = toNumber(payload.targetAmount);
    const yearsRemaining = Math.max(1, toNumber(payload.yearsRemaining || payload.targetYear - new Date().getFullYear(), 1));
    const estimatedFutureCost = Math.round(targetAmount * Math.pow(1.08, yearsRemaining));
    return {
      monthlySavingsNeeded: Math.ceil(estimatedFutureCost / (yearsRemaining * 12)),
      estimatedFutureCost,
      strategy: ["Use recurring monthly savings.", "Increase contribution after high-income seasons."],
    };
  };

  const result = await postToAI("/education-plan", payload, fallback);
  await prisma.educationPlan.create({
    data: {
      userId,
      childAge: toNumber(payload.childAge),
      targetAmount: toNumber(payload.targetAmount),
      targetYear: toNumber(payload.targetYear || new Date().getFullYear() + toNumber(payload.yearsRemaining, 1)),
      estimatedFutureCost: toNumber(result.estimatedFutureCost),
      monthlySavingsNeeded: toNumber(result.monthlySavingsNeeded),
      strategy: result.strategy || [],
    },
  });
  emitToUser(userId, "ai-analysis-complete", { type: "education-plan", result });
  return result;
};

const goldPrice = async () => {
  return {
    currency: "INR",
    pricePerGram: 7200,
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
};

const goldPlan = async (userId, payload) => {
  const price = await goldPrice();
  const fallback = () => {
    const savingsAmount = toNumber(payload.savingsAmount);
    const goldEquivalent = Number((savingsAmount / price.pricePerGram).toFixed(3));
    return {
      goldEquivalent,
      estimatedGrowth: Math.round(savingsAmount * 1.08),
      recommendations: ["Buy in small monthly amounts instead of one risky purchase."],
    };
  };

  const result = await postToAI("/gold-plan", { ...payload, goldPrice: price.pricePerGram }, fallback);
  await prisma.goldSavingsPlan.create({
    data: {
      userId,
      savingsAmount: toNumber(payload.savingsAmount),
      goldEquivalent: toNumber(result.goldEquivalent),
      estimatedGrowth: toNumber(result.estimatedGrowth),
      recommendations: result.recommendations || [],
    },
  });
  emitToUser(userId, "ai-analysis-complete", { type: "gold-plan", result });
  return result;
};

const cashflowForecast = async (userId, payload) => {
  const fallback = () => {
    const income = toNumber(payload.income);
    const expenses = toNumber(payload.expenses);
    const currentBalance = toNumber(payload.currentBalance);
    const predictedBalance = currentBalance + income - expenses;
    const result = {
      predictedBalance,
      bestCase: predictedBalance + Math.round(income * 0.1),
      worstCase: predictedBalance - Math.round(expenses * 0.15),
      warnings: predictedBalance < 0 ? ["Possible deficit next month."] : [],
    };
    return result;
  };

  const result = await postToAI("/cashflow-forecast", payload, fallback);
  await prisma.cashFlowForecast.create({
    data: {
      userId,
      predictedBalance: toNumber(result.predictedBalance),
      bestCase: toNumber(result.bestCase),
      worstCase: toNumber(result.worstCase),
      warnings: result.warnings || [],
    },
  });
  emitToUser(userId, "ai-analysis-complete", { type: "cashflow-forecast", result });
  if (result.warnings?.length) emitToUser(userId, "forecast-warning", result);
  return result;
};

const seasonalIncome = async (userId, payload) => {
  const fallback = () => ({
    highIncomeMonths: payload.highIncomeMonths || ["October", "November"],
    lowIncomeMonths: payload.lowIncomeMonths || ["June", "July"],
    riskPeriods: payload.riskPeriods || ["Before harvest"],
    recommendations: ["Save extra during harvest months.", "Reduce non-essential spending in low-income months."],
  });

  const result = await postToAI("/seasonal-income", payload, fallback);
  await prisma.seasonalIncomeInsight.create({
    data: {
      userId,
      highIncomeMonths: result.highIncomeMonths || [],
      lowIncomeMonths: result.lowIncomeMonths || [],
      riskPeriods: result.riskPeriods || [],
      recommendations: result.recommendations || [],
    },
  });
  emitToUser(userId, "ai-analysis-complete", { type: "seasonal-income", result });
  return result;
};

module.exports = {
  budgetPlan,
  emergencyFund,
  educationPlan,
  goldPrice,
  goldPlan,
  cashflowForecast,
  seasonalIncome,
};
