// src/modules/chat/chat.controller.js

const chatService = require("./chat.service");
const { sendSuccess } = require("../../utils/apiResponse");

/**
 * POST /api/chat/message
 * Text-based chat
 */
const sendTextMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message, language, context } = req.body;

    const result = await chatService.handleTextMessage(userId, {
      message,
      language,
      context,
    });

    return sendSuccess(res, "Message processed successfully.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chat/voice
 * Voice-based chat — audio file uploaded via multipart
 */
const sendVoiceMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required.",
      });
    }

    const language = req.body.language || req.user.language || "en";

    const result = await chatService.handleVoiceMessage(
      userId,
      req.file.buffer,
      req.file.mimetype,
      language
    );

    return sendSuccess(res, "Voice message processed successfully.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/history
 * Fetch past chat messages for the authenticated user
 */
const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 50;

    const messages = await chatService.getChatHistory(userId, limit);

    return sendSuccess(res, "Chat history fetched successfully.", { messages });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendTextMessage, sendVoiceMessage, getChatHistory };