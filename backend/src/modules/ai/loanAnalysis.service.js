// src/modules/ai/loanAnalysis.service.js
// Enriches loan request with DB context, calls AI, saves results

const prisma = require("../../config/db");
const aiClient = require("../../services/aiClient");
const logger = require("../../utils/logger");

/**
 * Main entry point for loan analysis
 * 1. Fetch user financial context from DB
 * 2. Build enriched payload for AI service
 * 3. Call AI service
 * 4. Save results to DB
 * 5. Return structured response
 */
const runLoanAnalysis = async (userId, frontendInput) => {
  const {
    requestedLoanAmount,
    expectedInterestRate,
    tenureMonths,
    loanPurpose,
    collateralValue = null,
  } = frontendInput;

  // ── STEP 1: Fetch user context from DB ───────────
  const userContext = await buildUserContext(userId);

  // ── STEP 2: Build AI service payload ─────────────
  const aiPayload = {
    requestedLoanAmount,
    expectedInterestRate,
    tenureMonths,
    loanPurpose,
    collateralValue,
    userProfile: userContext,
  };

  // ── STEP 3: Call AI service ───────────────────────
  let aiResponse;
  try {
    aiResponse = await aiClient.post("/loan/analyze", aiPayload);
  } catch (err) {
    logger.error(`Loan AI service error for user ${userId}: ${err.message}`);
    throw err;
  }

  // ── STEP 4: Save to DB ────────────────────────────
  const saved = await saveLoanAnalysis(userId, frontendInput, aiResponse);

  // ── STEP 5: Return to controller ─────────────────
  return {
    analysisId: saved.id,
    arthScore: aiResponse.arthScore,
    riskLevel: aiResponse.riskLevel,
    loanSummary: aiResponse.loanSummary,
    repaymentForecast: aiResponse.repaymentForecast,
    positiveFactors: aiResponse.positiveFactors,
    negativeFactors: aiResponse.negativeFactors,
    riskFactors: aiResponse.riskFactors,
    recommendations: aiResponse.recommendations,
    recommendedProducts: aiResponse.recommendedProducts,
    createdAt: saved.createdAt,
  };
};

// ─────────────────────────────────────────
// BUILD USER CONTEXT FROM DB
// Aggregates everything the AI needs about this user
// ─────────────────────────────────────────
const buildUserContext = async (userId) => {
  // Fetch user + profile data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      village: true,
      district: true,
      occupation: true,
      repaymentHabit: true,
    },
  });

  // Transaction summary — last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: sixMonthsAgo },
    },
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  });

  const transactionSummary = summarizeTransactions(transactions);

  // Latest RTC record — land ownership context
  const latestRTC = await prisma.rTCRecord.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      ownerName: true,
      landArea: true,
      cropType: true,
      village: true,
      district: true,
    },
  });

  // Past loan analyses — repayment history signal
  const pastAnalyses = await prisma.loanAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      requestedLoanAmount: true,
      eligibleAmount: true,
      arthScore: true,
      riskLevel: true,
      createdAt: true,
    },
  });

 return {
    village: user?.village || null,
    district: user?.district || null,
    occupation: user?.occupation || "GENERIC",
    repaymentHabit: user?.repaymentHabit || "no_loans_yet",
    transactionSummary,
    rtcData: latestRTC
      ? {
          landOwned: true,
          landArea: latestRTC.landArea,
          cropType: latestRTC.cropType,
          village: latestRTC.village,
          district: latestRTC.district,
        }
      : { landOwned: false },
    loanHistory: pastAnalyses,
  };
};

// ─────────────────────────────────────────
// TRANSACTION AGGREGATION
// ─────────────────────────────────────────
const summarizeTransactions = (transactions) => {
  const incomeEntries = transactions.filter((t) => t.type === "income");
  const expenseEntries = transactions.filter((t) => t.type === "expense");

  const totalIncome = incomeEntries.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseEntries.reduce((s, t) => s + t.amount, 0);

  const months = incomeEntries.length > 0
    ? Math.max(1, Math.ceil(incomeEntries.length / 4))
    : 1;

  const avgIncome = totalIncome / months;
  const avgExpense = totalExpense / months;

  // Detect seasonal variation — std deviation of monthly income
  const monthlyIncomeMap = {};
  incomeEntries.forEach((t) => {
    const key = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth()}`;
    monthlyIncomeMap[key] = (monthlyIncomeMap[key] || 0) + t.amount;
  });
  const monthlyValues = Object.values(monthlyIncomeMap);
  const mean = monthlyValues.reduce((a, b) => a + b, 0) / (monthlyValues.length || 1);
  const variance =
    monthlyValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
    (monthlyValues.length || 1);
  const stdDev = Math.sqrt(variance);
  const seasonalIncomeVariation = mean > 0 && stdDev / mean > 0.3;

  return {
    avgIncome: Math.round(avgIncome),
    avgExpense: Math.round(avgExpense),
    totalTransactions: transactions.length,
    seasonalIncomeVariation,
    expenseRatio: avgIncome > 0 ? parseFloat((avgExpense / avgIncome).toFixed(2)) : null,
  };
};

// ─────────────────────────────────────────
// SAVE LOAN ANALYSIS TO DB
// ─────────────────────────────────────────
const saveLoanAnalysis = async (userId, input, ai) => {
  const ls = ai.loanSummary || {};

  const record = await prisma.loanAnalysis.create({
    data: {
      userId,
      requestedLoanAmount: input.requestedLoanAmount,
      eligibleAmount: ls.eligibleAmount ?? input.requestedLoanAmount,
      arthScore: ai.arthScore,
      riskLevel: ai.riskLevel,
      emi: ls.monthlyEMI ?? 0,
      tenureMonths: ls.recommendedTenure ?? input.tenureMonths,
      interestRate: ls.interestRate ?? input.expectedInterestRate,
      totalPayable: ls.totalPayable ?? 0,
      debtToIncomeRatio: ls.debtToIncomeRatio ?? 0,
      repaymentCapacity: 0, // filled by AI in future iterations
      loanPurpose: input.loanPurpose,
      collateralValue: input.collateralValue ?? null,
      positiveFactors: ai.positiveFactors || [],
      negativeFactors: ai.negativeFactors || [],
      riskFactors: ai.riskFactors || [],
      recommendations: ai.recommendations || [],
      rawAIResponse: ai,

      // Nested create repayment forecast entries
      repaymentForecast: {
        create: (ai.repaymentForecast || []).map((entry) => ({
          month: entry.month,
          predictedIncome: entry.predictedIncome,
          emi: entry.emi,
          remainingBalance: entry.remainingBalance,
        })),
      },

      // Nested create recommended products
      recommendedProducts: {
        create: (ai.recommendedProducts || []).map((p) => ({
          provider: p.provider,
          productName: p.productName,
          interestRate: p.interestRate,
          maxAmount: p.maxAmount,
          reason: p.reason,
        })),
      },
    },
  });

  return record;
};

// ─────────────────────────────────────────
// GET LOAN ANALYSIS HISTORY FOR USER
// ─────────────────────────────────────────
const getLoanHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [total, analyses] = await Promise.all([
    prisma.loanAnalysis.count({ where: { userId } }),
    prisma.loanAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        requestedLoanAmount: true,
        eligibleAmount: true,
        arthScore: true,
        riskLevel: true,
        emi: true,
        tenureMonths: true,
        loanPurpose: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    analyses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─────────────────────────────────────────
// GET SINGLE ANALYSIS BY ID
// ─────────────────────────────────────────
const getLoanAnalysisById = async (userId, analysisId) => {
  const record = await prisma.loanAnalysis.findFirst({
    where: { id: analysisId, userId },
    include: {
      repaymentForecast: { orderBy: { month: "asc" } },
      recommendedProducts: true,
    },
  });

  if (!record) {
    const err = new Error("Loan analysis not found.");
    err.statusCode = 404;
    throw err;
  }

  return record;
};

module.exports = {
  runLoanAnalysis,
  getLoanHistory,
  getLoanAnalysisById,
};