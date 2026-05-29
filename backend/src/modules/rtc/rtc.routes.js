// src/modules/rtc/rtc.routes.js
// Memory-only upload — file NEVER touches disk

const express = require("express");
const router = express.Router();
const multer = require("multer");

const rtcController = require("./rtc.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const environment = require("../../config/environment");

// ─────────────────────────────────────────
// MULTER — MEMORY STORAGE ONLY
// File lives in req.file.buffer in RAM.
// It is NEVER written to disk.
// ─────────────────────────────────────────
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Reject file — error flows to global error middleware
    cb(
      Object.assign(
        new Error(
          "Invalid file type. Only JPEG, JPG, PNG, WEBP, and PDF files are allowed."
        ),
        { statusCode: 415 }
      ),
      false
    );
  }
};

const upload = multer({
  storage,           // RAM only — no disk
  fileFilter,
  limits: {
    fileSize: (environment.upload?.maxFileSizeMb || 10) * 1024 * 1024,
  },
});

// ─────────────────────────────────────────
// ROUTES — all protected
// ─────────────────────────────────────────
router.use(authMiddleware);

// POST /api/rtc/upload
// upload.single() puts file into req.file.buffer (memory only)
router.post("/upload", upload.single("file"), rtcController.uploadRTC);

// GET /api/rtc
router.get("/", rtcController.getAllRTCRecords);

// GET /api/rtc/:id
router.get("/:id", rtcController.getRTCRecordById);

module.exports = router;