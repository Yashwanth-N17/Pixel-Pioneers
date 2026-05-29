// src/modules/ai/ai.routes.js

const express = require("express");
const router = express.Router();

const aiController = require("./ai.controller");
const {
  financialGuidanceValidation,
  scamDetectionValidation,
  loanAnalysisValidation,
} = require("./ai.validation");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");

// All AI routes are protected
router.use(authMiddleware);

// POST /api/ai/financial-guidance — unchanged
router.post(
  "/financial-guidance",
  financialGuidanceValidation,
  validate,
  aiController.financialGuidance
);

// POST /api/ai/scam-detection — unchanged
router.post(
  "/scam-detection",
  scamDetectionValidation,
  validate,
  aiController.scamDetection
);

// POST /api/ai/loan-analysis — upgraded to ArthScore engine
// IMPORTANT: history and :id routes must be defined BEFORE the POST
// to avoid route conflicts
router.get(
  "/loan-analysis/history",
  aiController.getLoanHistory
);

router.get(
  "/loan-analysis/:id",
  aiController.getLoanAnalysisById
);

router.post(
  "/loan-analysis",
  loanAnalysisValidation,
  validate,
  aiController.loanAnalysis
);

module.exports = router;