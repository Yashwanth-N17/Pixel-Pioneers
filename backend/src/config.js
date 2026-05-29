require("dotenv").config();

const config = {
  port: Number(process.env.PORT || 8000),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8001",
  maxAudioSizeMb: Number(process.env.MAX_AUDIO_SIZE_MB || 25),
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

module.exports = { config };
