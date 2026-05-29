// src/middlewares/error.middleware.js
// Global error handler — catches anything not handled in controllers

const logger = require("../utils/logger");
const { sendError } = require("../utils/apiResponse");

const errorMiddleware = (err, req, res, next) => {
  logger.error(err);

  // Prisma known request errors
  if (err.code === "P2002") {
    return sendError(res, "A record with this data already exists.", 409);
  }

  if (err.code === "P2025") {
    return sendError(res, "Record not found.", 404);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token.", 401);
  }

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, "File size too large.", 413);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return sendError(res, "Unexpected file field.", 400);
  }

  // Generic fallback
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return sendError(res, message, statusCode);
};

module.exports = errorMiddleware;