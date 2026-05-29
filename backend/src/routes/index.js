// src/routes/index.js
// Central route registry — mounts all module routes

const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const transactionsRoutes = require("../modules/transactions/transactions.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const aiRoutes = require("../modules/ai/ai.routes");
const rtcRoutes = require("../modules/rtc/rtc.routes");
const profileRoutes = require("../modules/profile/profile.routes");
const chatRoutes = require("../modules/chat/chat.routes");
const paymentsRoutes = require("../modules/payments/payments.routes"); // ← NEW

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ArthSaathi API is running.",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/transactions", transactionsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);
router.use("/rtc", rtcRoutes);
router.use("/profile", profileRoutes);
router.use("/chat", chatRoutes);
router.use("/payments", paymentsRoutes); // ← NEW

module.exports = router;