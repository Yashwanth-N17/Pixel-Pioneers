// src/modules/ai/ai.service.js
// Communicates with FastAPI AI service and persists reports

const axios = require("axios");
const prisma = require("../../config/db");
const environment = require("../../config/environment");
const logger = require("../../utils/logger");

const AI_BASE_URL = environment.ai.serviceUrl;

// Axios instance for AI service
const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Send a financial guidance query to AI service
 */
const getFinancialGuidance = async (userId, { query, language }) => {
  const inputData = { query, language: language || "en" };

  let aiResponse;

  try {
    const response = await aiClient.post("/finance/analyze", inputData);
    aiResponse = response.data;
  } catch (err) {
    logger.error(`AI service error (finance/analyze): ${err.message}`);
    throw buildAIServiceError(err);
  }

  const report = await prisma.aIReport.create({
    data: {
      userId,
      reportType: "financial_guidance",
      inputData,
      aiResponse,
    },
  });

  return { reportId: report.id, result: aiResponse };
};

/**
 * Send a message to scam detection AI
 */
const detectScam = async (userId, { message }) => {
  const inputData = { message };

  let aiResponse;

  try {
    const response = await aiClient.post("/scam/detect", inputData);
    aiResponse = response.data;
  } catch (err) {
    logger.error(`AI service error (scam/detect): ${err.message}`);
    throw buildAIServiceError(err);
  }

  const report = await prisma.aIReport.create({
    data: {
      userId,
      reportType: "scam_detection",
      inputData,
      aiResponse,
    },
  });

  return { reportId: report.id, result: aiResponse };
};

/**
 * Build a clean error when AI service is unreachable or fails
 */
const buildAIServiceError = (err) => {
  if (err.response) {
    const error = new Error(
      err.response.data?.detail || "AI service returned an error."
    );
    error.statusCode = err.response.status || 502;
    return error;
  } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    const error = new Error("AI service is currently unavailable. Please try again later.");
    error.statusCode = 503;
    return error;
  } else {
    const error = new Error("Failed to communicate with AI service.");
    error.statusCode = 502;
    return error;
  }
};

// analyzeLoan removed — now handled by loanAnalysis.service.js

module.exports = { getFinancialGuidance, detectScam };