// src/modules/dashboard/dashboard.routes.js

const express = require("express");
const router = express.Router();

const dashboardController = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// GET /api/dashboard  (protected)
router.get("/", authMiddleware, dashboardController.getDashboard);

module.exports = router;