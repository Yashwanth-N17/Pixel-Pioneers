// src/modules/chat/chat.service.js
// Handles forwarding chat (text + voice) to AI service and persisting messages

const axios = require("axios");
const FormData = require("form-data");
const prisma = require("../../config/db");
const environment = require("../../config/environment");
const logger = require("../../utils/logger");

const AI_SERVICE_URL = environment.ai.serviceUrl;

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

/**
 * Fetch the user's financial context to enrich AI prompts
 */
const getUserContext = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      language: true,
      occupation: true,
      monthlyIncome: true,
      monthlyExpenses: true,
      repaymentHabit: true,
      loanHistory: true,
      farmerProfile: true,
      shopProfile: true,
      tailorProfile: true,
      genericProfile: true,
    },
  });
  return user;
};

/**
 * Persist both the user message and AI reply to ChatMessage table
 */
const saveMessages = async (
  userId,
  userContent,
  assistantContent,
  language,
  inputType,
  intent
) => {
  await prisma.chatMessage.createMany({
    data: [
      {
        userId,
        role: "user",
        content: userContent,
        language,
        inputType,
        intent,
      },
      {
        userId,
        role: "assistant",
        content: assistantContent,
        language,
        inputType: "text", // AI always responds in text
        intent,
      },
    ],
  });
};

// ─────────────────────────────────────────
// TEXT CHAT
// ─────────────────────────────────────────

const handleTextMessage = async (userId, { message, language, context }) => {
  const userContext = await getUserContext(userId);
  const lang = language || userContext?.language || "en";

  // Build payload for AI service
  const payload = {
    message,
    language: lang,
    user_context: {
      name: userContext?.name,
      occupation: userContext?.occupation,
      monthly_income: userContext?.monthlyIncome,
      monthly_expenses: userContext?.monthlyExpenses,
      repayment_habit: userContext?.repaymentHabit,
      loan_history: userContext?.loanHistory,
      ...(context || {}),
    },
  };

  logger.info(`[CHAT] Forwarding text message to AI service for user ${userId}`);

  let aiResponse;
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/chat/message`,
      payload,
      { timeout: 30000 }
    );
    aiResponse = response.data;
  } catch (error) {
    logger.error("[CHAT] AI service error:", error?.response?.data || error.message);
    const err = new Error("AI service is currently unavailable. Please try again.");
    err.statusCode = 503;
    throw err;
  }

  const assistantReply = aiResponse?.response || "Sorry, I could not process that.";
  const detectedIntent = aiResponse?.intent || "general";

  // Persist to DB
  await saveMessages(
    userId,
    message,
    assistantReply,
    lang,
    "text",
    detectedIntent
  );

  return {
    reply: assistantReply,
    intent: detectedIntent,
    language: lang,
    detectedExpenses: aiResponse?.detected_expenses || null,
    suggestions: aiResponse?.suggestions || null,
  };
};

// ─────────────────────────────────────────
// VOICE CHAT
// ─────────────────────────────────────────

const handleVoiceMessage = async (userId, audioBuffer, mimetype, language) => {
  const userContext = await getUserContext(userId);
  const lang = language || userContext?.language || "en";

  // Build multipart form to send audio + metadata to AI service
  const form = new FormData();
  form.append("audio", audioBuffer, {
    filename: "voice_input.webm",
    contentType: mimetype || "audio/webm",
  });
  form.append("language", lang);
  form.append(
    "user_context",
    JSON.stringify({
      name: userContext?.name,
      occupation: userContext?.occupation,
      monthly_income: userContext?.monthlyIncome,
      monthly_expenses: userContext?.monthlyExpenses,
      repayment_habit: userContext?.repaymentHabit,
    })
  );

  logger.info(`[CHAT] Forwarding voice message to AI service for user ${userId}`);

  let aiResponse;
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/chat/voice`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 60000, // Voice processing takes longer
      }
    );
    aiResponse = response.data;
  } catch (error) {
    logger.error("[CHAT] AI service voice error:", error?.response?.data || error.message);
    const err = new Error("Voice processing failed. Please try again.");
    err.statusCode = 503;
    throw err;
  }

  const transcribedText = aiResponse?.transcribed_text || "";
  const assistantReply = aiResponse?.response || "Sorry, I could not process that.";
  const detectedIntent = aiResponse?.intent || "general";

  // Persist to DB — save the transcribed text as the user message
  await saveMessages(
    userId,
    transcribedText,
    assistantReply,
    lang,
    "voice",
    detectedIntent
  );

  return {
    transcribedText,
    reply: assistantReply,
    intent: detectedIntent,
    language: lang,
    detectedExpenses: aiResponse?.detected_expenses || null,
    suggestions: aiResponse?.suggestions || null,
  };
};

// ─────────────────────────────────────────
// FETCH CHAT HISTORY
// ─────────────────────────────────────────

const getChatHistory = async (userId, limit = 50) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: parseInt(limit),
    select: {
      id: true,
      role: true,
      content: true,
      language: true,
      inputType: true,
      intent: true,
      createdAt: true,
    },
  });
  return messages;
};

module.exports = {
  handleTextMessage,
  handleVoiceMessage,
  getChatHistory,
};