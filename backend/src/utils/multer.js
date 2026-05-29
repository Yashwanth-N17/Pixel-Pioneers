// src/utils/multer.js
// Shared Multer memory storage configuration

const multer = require("multer");

// Store files in memory — forwarded as buffers to AI service
const storage = multer.memoryStorage();

// Audio upload — for voice chat
const audioUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
      "audio/ogg",
      "audio/flac",
      "audio/m4a",
      "audio/x-m4a",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid audio format. Allowed: mp3, mp4, wav, webm, ogg, flac, m4a"
        ),
        false
      );
    }
  },
});

// Image/document upload — for RTC and other docs
const documentUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file format. Allowed: jpg, png, webp, pdf"),
        false
      );
    }
  },
});

module.exports = { audioUpload, documentUpload };