// src/modules/payments/payments.service.js
// Mock payment logic

const prisma = require("../../config/db");
const logger = require("../../utils/logger");

// ─────────────────────────────────────────
// HELPER — Generate unique receipt ID
// ─────────────────────────────────────────
const generateReceipt = () => {
  const ts = Date.now().toString(36).toUpperCase(); // base36 timestamp
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCPT_${ts}_${rand}`.slice(0, 40);
};

// ─────────────────────────────────────────
// PROCESS MOCK CHECKOUT
// ─────────────────────────────────────────
const processMockCheckout = async (
  userId,
  amount,
  description,
  category,
  shgGroupId,
  shgTransactionType,
  repaymentDeadline
) => {
  let finalAmount = parseFloat(amount);
  let lateFeeApplied = null;

  // 1. Calculate Late Fees if applicable
  if (shgTransactionType === "loan_repayment" && repaymentDeadline) {
    const deadline = new Date(repaymentDeadline);
    const now = new Date();
    
    // Check if current date is past the deadline
    if (now > deadline) {
      const feeAmount = Math.round(finalAmount * 0.05); // 5% late fee
      finalAmount += feeAmount;
      lateFeeApplied = {
        feeAmount,
        originalAmount: parseFloat(amount),
        totalAmount: finalAmount
      };
      logger.info(`[MOCK PAYMENT] Late fee applied: ${feeAmount} for user ${userId}`);
    }
  }

  const amountPaise = Math.round(finalAmount * 100);
  const receipt = generateReceipt();

  // Create a mock Razorpay order ID just to satisfy schema uniqueness
  const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const mockPaymentId = `pay_mock_${Date.now()}_${Math.floor(Math.random()*1000)}`;

  // Start Transaction
  return prisma.$transaction(async (tx) => {
    // 2. Create Transaction in Personal Ledger
    const transaction = await tx.transaction.create({
      data: {
        userId,
        amount: finalAmount,
        type: "expense", // paying out of personal account
        category: category || (shgGroupId ? "SHG" : "Payment"),
        note: description || `Mock Payment`,
        date: new Date(),
        ledgerMeta: {
          mockOrderId,
          mockPaymentId,
          receipt,
          ...(lateFeeApplied && { lateFeeApplied })
        },
      },
    });

    // 3. Create Payment record in DB with status "paid"
    const payment = await tx.payment.create({
      data: {
        userId,
        razorpayOrderId: mockOrderId,
        razorpayPaymentId: mockPaymentId,
        amount: finalAmount,
        amountPaise,
        currency: "INR",
        status: "paid",
        method: "unknown",
        description: description || null,
        category: category || null,
        receipt,
        transactionId: transaction.id,
      },
    });

    // 4. Handle SHG Auto-Sync if applicable
    let shgTransaction = null;
    if (shgGroupId && shgTransactionType) {
      
      shgTransaction = await tx.shgTransaction.create({
        data: {
          groupId: shgGroupId,
          createdById: userId,
          type: shgTransactionType,
          amount: finalAmount,
          status: "approved", // Deposits/Repayments are instantly approved
          description: description || `Mock ${shgTransactionType} from checkout`,
          metadata: {
            mockPaymentId,
            ...(lateFeeApplied && { lateFeeApplied })
          },
        },
      });

      // Update SHG balance
      await tx.shgGroup.update({
        where: { id: shgGroupId },
        data: { totalBalance: { increment: finalAmount } },
      });

      // Log audit
      await tx.shgAuditLog.create({
        data: {
          groupId: shgGroupId,
          actorId: userId,
          actionType: "transaction_approved",
          payload: {
            transactionId: shgTransaction.id,
            type: shgTransactionType,
            amount: finalAmount,
            source: "mock_checkout"
          }
        }
      });
    }

    return {
      payment,
      transaction,
      lateFeeApplied,
      shgTransaction
    };
  });
};

// ─────────────────────────────────────────
// GET PAYMENT HISTORY
// ─────────────────────────────────────────
const getPaymentHistory = async (userId, filters = {}) => {
  const where = { userId };

  if (filters.status) where.status = filters.status;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      razorpayOrderId: true,
      razorpayPaymentId: true,
      amount: true,
      currency: true,
      status: true,
      method: true,
      description: true,
      category: true,
      receipt: true,
      transactionId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return payments;
};

// ─────────────────────────────────────────
// GET SINGLE PAYMENT
// ─────────────────────────────────────────
const getPaymentById = async (userId, paymentId) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
  });

  if (!payment) {
    const error = new Error("Payment not found.");
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

// ─────────────────────────────────────────
// GET PAYMENT ANALYTICS
// ─────────────────────────────────────────
const getPaymentAnalytics = async (userId) => {
  const [totalPaid, totalFailed, recentPayments, categoryBreakdown] =
    await Promise.all([
      prisma.payment.aggregate({
        where: { userId, status: "paid" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.count({
        where: { userId, status: "failed" },
      }),
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          description: true,
          category: true,
          method: true,
          createdAt: true,
        },
      }),
      prisma.payment.groupBy({
        by: ["category"],
        where: { userId, status: "paid" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyPayments = await prisma.payment.findMany({
    where: {
      userId,
      status: "paid",
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyMap = {};
  monthlyPayments.forEach((p) => {
    const key = `${p.createdAt.getFullYear()}-${String(
      p.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + p.amount;
  });

  return {
    totalAmountPaid: totalPaid._sum.amount || 0,
    totalPaymentsCount: totalPaid._count.id || 0,
    failedPaymentsCount: totalFailed,
    recentPayments,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category || "Uncategorized",
      totalAmount: c._sum.amount || 0,
      count: c._count.id,
    })),
    monthlyBreakdown: Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount,
    })),
  };
};

module.exports = {
  processMockCheckout,
  getPaymentHistory,
  getPaymentById,
  getPaymentAnalytics,
};