// src/modules/rtc/rtc.service.js
//
// SECURITY: Files are NEVER saved to disk or stored in DB.
// Only extracted text metadata is persisted.
//
// Flow:
//   req.file.buffer (RAM)
//   → FormData stream → FastAPI /ocr/extract
//   → extracted fields returned
//   → only metadata saved to PostgreSQL
//   → buffer garbage-collected automatically

const axios = require("axios");
const FormData = require("form-data");
const prisma = require("../../config/db");
const environment = require("../../config/environment");
const logger = require("../../utils/logger");

const AI_BASE_URL = environment.ai.serviceUrl;

// ─────────────────────────────────────────
// PROCESS RTC UPLOAD
// ─────────────────────────────────────────

/**
 * Receives file buffer from controller,
 * forwards to FastAPI OCR service,
 * saves ONLY extracted text fields to DB.
 *
 * @param {string} userId
 * @param {Express.Multer.File} file — multer memory file object
 * @returns {object} extracted RTC metadata + DB record ID
 */
const processRTCUpload = async (userId, file) => {
  // ── Guard: file must exist ───────────────
  if (!file || !file.buffer) {
    const error = new Error("No file uploaded. Please attach an image or PDF.");
    error.statusCode = 400;
    throw error;
  }

  // ── Guard: buffer must not be empty ──────
  if (file.buffer.length === 0) {
    const error = new Error("Uploaded file is empty.");
    error.statusCode = 400;
    throw error;
  }

  logger.info(
    `RTC upload received — user: ${userId}, file: ${file.originalname}, ` +
    `size: ${(file.buffer.length / 1024).toFixed(1)} KB, type: ${file.mimetype}`
  );

  // ─────────────────────────────────────────
  // STEP 1: Build multipart FormData from buffer
  // No disk path used — buffer streamed directly
  // ─────────────────────────────────────────
  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
    knownLength: file.buffer.length,
  });

  // ─────────────────────────────────────────
  // STEP 2: Forward buffer to FastAPI OCR service
  // ─────────────────────────────────────────
  let ocrResponse;

  try {
    const response = await axios.post(
      `${AI_BASE_URL}/ocr/extract`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60s — OCR can be slow for dense PDFs
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    ocrResponse = response.data;
    logger.info(`OCR extraction successful for user: ${userId}`);
  } catch (err) {
    // Let buffer get GC'd — no cleanup needed (no disk file)
    throw buildOCRServiceError(err);
  }

  // ─────────────────────────────────────────
  // STEP 3: Parse extracted fields from OCR response
  // FastAPI is expected to return { extracted: { ... } }
  // or the fields at the top level — handle both
  // ─────────────────────────────────────────
  const extracted = ocrResponse?.extracted ?? ocrResponse ?? {};

  const {
    ownerName    = null,
    surveyNumber = null,
    landArea     = null,
    cropType     = null,
    village      = null,
    taluk        = null,
    district     = null,
  } = extracted;

  // Sanitize — ensure no accidental binary/buffer data leaks into DB
  const sanitizedOCRData = sanitizeForJSON(ocrResponse);

  // ─────────────────────────────────────────
  // STEP 4: Persist ONLY extracted metadata to PostgreSQL
  // NO filePath, NO fileName, NO imageUrl, NO buffer
  // ─────────────────────────────────────────
  const rtcRecord = await prisma.rTCRecord.create({
    data: {
      userId,
      ownerName,
      surveyNumber,
      landArea,
      cropType,
      village,
      taluk,
      district,
      rawOCRData: sanitizedOCRData, // text fields only, no binary
    },
  });

  logger.info(`RTC metadata saved — recordId: ${rtcRecord.id}, user: ${userId}`);

  // Buffer is now out of scope — GC will free it automatically

  // ─────────────────────────────────────────
  // STEP 5: Return extracted data to controller → frontend
  // ─────────────────────────────────────────
  return {
    recordId: rtcRecord.id,
    extractedData: {
      ownerName:    rtcRecord.ownerName,
      surveyNumber: rtcRecord.surveyNumber,
      landArea:     rtcRecord.landArea,
      cropType:     rtcRecord.cropType,
      village:      rtcRecord.village,
      taluk:        rtcRecord.taluk,
      district:     rtcRecord.district,
    },
    createdAt: rtcRecord.createdAt,
  };
};

// ─────────────────────────────────────────
// GET ALL RTC RECORDS FOR USER
// ─────────────────────────────────────────
const getUserRTCRecords = async (userId) => {
  const records = await prisma.rTCRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id:           true,
      ownerName:    true,
      surveyNumber: true,
      landArea:     true,
      cropType:     true,
      village:      true,
      taluk:        true,
      district:     true,
      createdAt:    true,
    },
  });

  return records;
};

// ─────────────────────────────────────────
// GET SINGLE RTC RECORD BY ID
// ─────────────────────────────────────────
const getRTCRecordById = async (userId, recordId) => {
  const record = await prisma.rTCRecord.findFirst({
    where: { id: recordId, userId },
    select: {
      id:           true,
      ownerName:    true,
      surveyNumber: true,
      landArea:     true,
      cropType:     true,
      village:      true,
      taluk:        true,
      district:     true,
      rawOCRData:   true,
      createdAt:    true,
      updatedAt:    true,
    },
  });

  if (!record) {
    const error = new Error("RTC record not found.");
    error.statusCode = 404;
    throw error;
  }

  return record;
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

/**
 * Build a clean, typed error from FastAPI/axios failures.
 */
const buildOCRServiceError = (err) => {
  if (err.response) {
    // FastAPI replied with an HTTP error
    const message =
      err.response.data?.detail ||
      err.response.data?.message ||
      "OCR service returned an error.";
    const error = new Error(message);
    error.statusCode = err.response.status >= 500 ? 502 : err.response.status;
    logger.error(`OCR service HTTP error ${err.response.status}: ${message}`);
    return error;
  }

  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    logger.error(`OCR service unreachable: ${err.code}`);
    const error = new Error(
      "OCR service is currently unavailable. Please try again later."
    );
    error.statusCode = 503;
    return error;
  }

  if (err.code === "ECONNABORTED") {
    logger.error("OCR service timed out.");
    const error = new Error(
      "OCR service timed out processing the document. Please try with a smaller file."
    );
    error.statusCode = 504;
    return error;
  }

  logger.error(`Unexpected OCR error: ${err.message}`);
  const error = new Error("Failed to communicate with OCR service.");
  error.statusCode = 502;
  return error;
};

/**
 * Strip any non-serializable or binary values from the OCR response
 * before writing to the JSON column in PostgreSQL.
 */
const sanitizeForJSON = (data) => {
  try {
    // JSON round-trip removes undefined, functions, Buffers, etc.
    return JSON.parse(JSON.stringify(data));
  } catch {
    // If response was totally unparseable, store a safe fallback
    return { raw: String(data).slice(0, 2000) };
  }
};

module.exports = {
  processRTCUpload,
  getUserRTCRecords,
  getRTCRecordById,
};