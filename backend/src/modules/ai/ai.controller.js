// src/modules/ai/ai.controller.js

const aiService = require("./ai.service");
const loanAnalysisService = require("./loanAnalysis.service");
const { sendSuccess } = require("../../utils/apiResponse");

/**
 * POST /api/ai/financial-guidance
 * Unchanged — works exactly as before
 */
const financialGuidance = async (req, res, next) => {
  try {
    const { query, language } = req.body;
    const result = await aiService.getFinancialGuidance(req.user.id, { query, language });
    return sendSuccess(res, "Financial guidance generated.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/scam-detection
 * Unchanged — works exactly as before
 */
const scamDetection = async (req, res, next) => {
  try {
    const { message } = req.body;
    const result = await aiService.detectScam(req.user.id, { message });
    return sendSuccess(res, "Scam detection completed.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/loan-analysis
 * Upgraded — now uses full ArthScore engine via loanAnalysis.service.js
 */
const loanAnalysis = async (req, res, next) => {
  try {
    const result = await loanAnalysisService.runLoanAnalysis(req.user.id, req.body);
    return sendSuccess(res, "Loan analysis completed.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/loan-analysis/history
 * New — paginated loan analysis history
 */
const getLoanHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await loanAnalysisService.getLoanHistory(req.user.id, page, limit);
    return sendSuccess(res, "Loan history fetched.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/loan-analysis/:id
 * New — full detail of one analysis with forecast + products
 */
const getLoanAnalysisById = async (req, res, next) => {
  try {
    const result = await loanAnalysisService.getLoanAnalysisById(
      req.user.id,
      req.params.id
    );
    return sendSuccess(res, "Loan analysis fetched.", result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  financialGuidance,
  scamDetection,
  loanAnalysis,
  getLoanHistory,
  getLoanAnalysisById,
};