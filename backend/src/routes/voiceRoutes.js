const express = require("express");
const multer = require("multer");

const { config } = require("../config");
const { handleVoiceUpload } = require("../controllers/voiceController");

const voiceRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxAudioSizeMb * 1024 * 1024,
  },
});

voiceRouter.post("/", upload.single("audio"), handleVoiceUpload);

module.exports = { voiceRouter };
