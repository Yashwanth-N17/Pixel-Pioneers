const logger = require("../utils/logger");

function errorHandler(error, _req, res, _next) {
  logger.error(error);

  const status = error.response?.status || error.status || 500;

  const message =
    error.response?.data?.detail ||
    error.message ||
    "Internal server error";

  res.status(status).json({
    error: message,
  });
}

module.exports = { errorHandler };
