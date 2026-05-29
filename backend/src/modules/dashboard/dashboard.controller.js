// src/modules/dashboard/dashboard.controller.js

const dashboardService = require("./dashboard.service");
const { sendSuccess } = require("../../utils/apiResponse");

/**
 * GET /api/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardData(req.user.id);
    return sendSuccess(res, "Dashboard data fetched successfully.", data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };