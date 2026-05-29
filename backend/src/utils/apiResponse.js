// src/utils/apiResponse.js
// Standardized API response helpers — used in every controller

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Human-readable message
 * @param {any} data - Payload to return
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {any} errors - Validation or detail errors
 */
const sendError = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { sendSuccess, sendError };