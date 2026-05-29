// src/modules/chat/chat.routes.js

const express = require("express");
const router = express.Router();

const chatController = require("./chat.controller");
const { textMessageValidation } = require("./chat.validation");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const { audioUpload } = require("../../utils/multer");

// All chat routes require authentication
router.use(authMiddleware);

// GET /api/chat/history
router.get("/history", chatController.getChatHistory);

// POST /api/chat/message — text
router.post(
  "/message",
  textMessageValidation,
  validate,
  chatController.sendTextMessage
);

// POST /api/chat/voice — audio file
router.post(
  "/voice",
  audioUpload.single("audio"),
  chatController.sendVoiceMessage
);

module.exports = router;