// src/modules/payments/payments.service.js
// Core Razorpay payment logic

const crypto = require("crypto");
const razorpay = require("../../config/razorpay");
const prisma = require("../../config/db");
const environment = require("../../config/environment");
const logger = require("../../utils/logger");

// ─────────────────────────────────────────
// HELPER — Generate unique receipt ID
// Receipt ID must be unique per order and <= 40 chars
// ─────────────────────────────────────────
const generateReceipt = () => {
  const ts = Date.now().toString(36).toUpperCase(); // base36 timestamp
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCPT_${ts}_${rand}`.slice(0, 40);
};

// ─────────────────────────────────────────
// CREATE RAZORPAY ORDER
// Called when user clicks "Pay" in the app
// ─────────────────────────────────────────
/**
 * Creates a Razorpay order and stores it in the database.
 *
 * @param {string} userId - Authenticated user's ID
 * @param {number} amount - Amount in INR (e.g. 500 for ₹500)
 * @param {string} description - Optional payment description
 * @param {string} category - Optional expense category
 * @returns {object} - { orderId, amount, currency, keyId, receipt }
 */
const createOrder = async (userId, amount, description, category) => {
  // Convert INR to paise (Razorpay requires amount in smallest currency unit)
  const amountPaise = Math.round(parseFloat(amount) * 100);
  const receipt = generateReceipt();

  // Create order on Razorpay
  const razorpayOrder = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: userId,
      description: description || "HealthSehat Payment",
      category: category || "General",
      appName: environment.app.name,
    },
  });

  logger.info(`[PAYMENT] Razorpay order created: ${razorpayOrder.id} for user: ${userId}`);

  // Persist order in our database
  const payment = await prisma.payment.create({
    data: {
      userId,
      razorpayOrderId: razorpayOrder.id,
      amount: parseFloat(amount),
      amountPaise,
      currency: "INR",
      status: "created",
      description: description || null,
      category: category || null,
      receipt,
      razorpayOrderData: razorpayOrder,
    },
  });

  logger.info(`[PAYMENT] Payment record created in DB: ${payment.id}`);

  // Return only what frontend needs
  return {
    orderId: razorpayOrder.id,
    amount: amountPaise,          // Razorpay checkout needs paise
    amountInr: parseFloat(amount), // Human-readable INR amount
    currency: "INR",
    keyId: environment.razorpay.keyId, // Frontend needs this to open checkout
    receipt,
    paymentDbId: payment.id,
  };
};

// ─────────────────────────────────────────
// VERIFY PAYMENT
// Called after Razorpay checkout completes
// Verifies HMAC signature to prevent fraud
// ─────────────────────────────────────────
/**
 * Verifies the payment signature from Razorpay.
 * If valid, marks payment as paid and creates a transaction record.
 *
 * @param {string} userId
 * @param {string} razorpayOrderId  - order_XXXXXXX
 * @param {string} razorpayPaymentId - pay_XXXXXXX
 * @param {string} razorpaySignature - HMAC-SHA256 signature from Razorpay
 * @returns {object} - verified payment + created transaction
 */
const verifyPayment = async (
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  // ── Step 1: Verify HMAC signature ────────
  // Razorpay signs: SHA256(orderId + "|" + paymentId) using key_secret
  const expectedSignature = crypto
    .createHmac("sha256", environment.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    logger.warn(
      `[PAYMENT] Signature mismatch for order: ${razorpayOrderId}. Possible fraud attempt.`
    );
    const error = new Error("Payment verification failed. Invalid signature.");
    error.statusCode = 400;
    throw error;
  }

  logger.info(`[PAYMENT] Signature verified for order: ${razorpayOrderId}`);

  // ── Step 2: Find payment record in DB ────
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
  });

  if (!payment) {
    const error = new Error("Payment order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (payment.userId !== userId) {
    const error = new Error("Unauthorized payment verification.");
    error.statusCode = 403;
    throw error;
  }

  if (payment.status === "paid") {
    // Already verified — return existing data (idempotent)
    return { payment, alreadyVerified: true };
  }

  // ── Step 3: Fetch full payment details from Razorpay ──
  let razorpayPaymentData = null;
  let paymentMethod = "unknown";

  try {
    razorpayPaymentData = await razorpay.payments.fetch(razorpayPaymentId);
    paymentMethod = razorpayPaymentData.method || "unknown";
    logger.info(`[PAYMENT] Payment method: ${paymentMethod}`);
  } catch (e) {
    // Non-fatal — log and continue. We already have signature proof.
    logger.warn(`[PAYMENT] Could not fetch payment details from Razorpay: ${e.message}`);
  }

  // ── Step 4: Create a Transaction record ──
  // This integrates payment into the existing transaction/analytics system
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      amount: payment.amount,
      type: "expense",
      category: payment.category || "Payment",
      note: payment.description || `Payment via Razorpay (${razorpayPaymentId})`,
      date: new Date(),
      ledgerMeta: {
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod,
        receipt: payment.receipt,
      },
    },
  });

  logger.info(`[PAYMENT] Transaction record created: ${transaction.id}`);

  // ── Step 5: Update payment record as paid ──
  const updatedPayment = await prisma.payment.update({
    where: { razorpayOrderId },
    data: {
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      method: paymentMethod,
      razorpayPaymentData: razorpayPaymentData || {},
      transactionId: transaction.id,
      updatedAt: new Date(),
    },
  });

  logger.info(`[PAYMENT] Payment marked as paid: ${updatedPayment.id}`);

  return {
    payment: updatedPayment,
    transaction,
    alreadyVerified: false,
  };
};

// ─────────────────────────────────────────
// HANDLE WEBHOOK
// Called by Razorpay server-to-server for async events
// ─────────────────────────────────────────
/**
 * Processes Razorpay webhook events.
 * Webhook signature is verified using rawBody (Buffer).
 *
 * @param {string} rawBody - raw request body string
 * @param {string} signature - x-razorpay-signature header
 * @param {object} payload - parsed JSON body
 */
const handleWebhook = async (rawBody, signature, payload) => {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", environment.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    logger.warn("[WEBHOOK] Invalid webhook signature");
    const error = new Error("Invalid webhook signature.");
    error.statusCode = 400;
    throw error;
  }

  const event = payload.event;
  logger.info(`[WEBHOOK] Received event: ${event}`);

  // ── Handle payment.captured ──────────────
  if (event === "payment.captured") {
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) return { processed: false, reason: "No payment entity in payload" };

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (existingPayment && existingPayment.status !== "paid") {
      await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: "paid",
          method: paymentEntity.method || "unknown",
          razorpayPaymentData: paymentEntity,
          updatedAt: new Date(),
        },
      });
      logger.info(`[WEBHOOK] Payment captured via webhook: ${orderId}`);
    }
    return { processed: true, event };
  }

  // ── Handle payment.failed ────────────────
  if (event === "payment.failed") {
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) return { processed: false, reason: "No payment entity" };

    const orderId = paymentEntity.order_id;

    await prisma.payment.updateMany({
      where: {
        razorpayOrderId: orderId,
        status: { not: "paid" }, // Don't downgrade already-paid orders
      },
      data: {
        status: "failed",
        updatedAt: new Date(),
      },
    });

    logger.info(`[WEBHOOK] Payment failed via webhook: ${orderId}`);
    return { processed: true, event };
  }

  // ── Handle order.paid ────────────────────
  if (event === "order.paid") {
    logger.info(`[WEBHOOK] Order paid event received`);
    return { processed: true, event };
  }

  return { processed: false, reason: `Unhandled event: ${event}` };
};

// ─────────────────────────────────────────
// GET PAYMENT HISTORY
// Returns all payments for a user
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
// Summary stats for the user's payments
// ─────────────────────────────────────────
const getPaymentAnalytics = async (userId) => {
  const [totalPaid, totalFailed, recentPayments, categoryBreakdown] =
    await Promise.all([
      // Total successful payments amount
      prisma.payment.aggregate({
        where: { userId, status: "paid" },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Failed payment count
      prisma.payment.count({
        where: { userId, status: "failed" },
      }),

      // Last 5 payments
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

      // Spending by category
      prisma.payment.groupBy({
        by: ["category"],
        where: { userId, status: "paid" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

  // Monthly breakdown for last 6 months
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

  // Group by month
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
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getPaymentById,
  getPaymentAnalytics,
};