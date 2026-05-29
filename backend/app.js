// app.js
// Express application setup — middleware stack + routes

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const loggerMiddleware = require("./src/middlewares/logger.middleware");
const errorMiddleware = require("./src/middlewares/error.middleware");
const routes = require("./src/routes/index");

const app = express();

// ─────────────────────────────────────────
// SECURITY MIDDLEWARES
// ─────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: "*", // In production, restrict to your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

// ─────────────────────────────────────────
// RAW BODY — MUST come before express.json()
// Razorpay webhook signature verification requires the raw request body.
// We capture it here and attach as req.rawBody for webhook route.
// ─────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === "/api/payments/webhook") {
    // Capture raw body as Buffer for webhook signature verification
    let rawData = "";
    req.on("data", (chunk) => {
      rawData += chunk;
    });
    req.on("end", () => {
      req.rawBody = rawData;
      try {
        req.body = JSON.parse(rawData);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

// ─────────────────────────────────────────
// BODY PARSERS
// ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────
// HTTP LOGGER
// ─────────────────────────────────────────
app.use(loggerMiddleware);

// ─────────────────────────────────────────
// STATIC FILES
// ─────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────
app.use("/api", routes);

// ─────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER (must be last)
// ─────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;