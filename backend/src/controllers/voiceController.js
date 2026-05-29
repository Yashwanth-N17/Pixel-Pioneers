const { processAudio } = require("../services/aiServiceClient");
const { buildFrontendResponse } = require("../services/responseBuilder");

async function handleVoiceUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Missing audio file field named 'audio'.",
      });
    }

    const sessionId = req.body.sessionId || req.headers["x-session-id"] || "anonymous";

    const aiResult = await processAudio({
      audioBuffer: req.file.buffer,
      filename: req.file.originalname || "voice-input.wav",
      mimeType: req.file.mimetype || "application/octet-stream",
      sessionId,
    });

    return res.json(buildFrontendResponse(aiResult));
  } catch (error) {
    next(error);
  }
}

module.exports = { handleVoiceUpload };
