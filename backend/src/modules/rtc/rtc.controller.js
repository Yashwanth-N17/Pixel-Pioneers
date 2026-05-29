// src/modules/rtc/rtc.controller.js

const rtcService = require("./rtc.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/rtc/upload
 *
 * req.file is provided by multer memoryStorage.
 * req.file.buffer holds the file in RAM — never on disk.
 * After this function returns, the buffer is eligible for GC.
 */
const uploadRTC = async (req, res, next) => {
  try {
    // Multer memory storage puts file here — or undefined if nothing sent
    if (!req.file) {
      return sendError(
        res,
        "No file provided. Please upload a JPEG, PNG, WEBP, or PDF file.",
        400
      );
    }

    const result = await rtcService.processRTCUpload(req.user.id, req.file);

    // req.file.buffer goes out of scope here — GC handles the rest
    return sendSuccess(res, "RTC document processed successfully.", result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rtc
 * Returns all RTC metadata records for the authenticated user.
 * No file URLs or paths are returned — they were never stored.
 */
const getAllRTCRecords = async (req, res, next) => {
  try {
    const records = await rtcService.getUserRTCRecords(req.user.id);
    return sendSuccess(res, "RTC records fetched successfully.", records);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rtc/:id
 */
const getRTCRecordById = async (req, res, next) => {
  try {
    const record = await rtcService.getRTCRecordById(req.user.id, req.params.id);
    return sendSuccess(res, "RTC record fetched successfully.", record);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadRTC, getAllRTCRecords, getRTCRecordById };