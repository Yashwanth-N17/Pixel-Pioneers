// src/middlewares/logger.middleware.js
// Morgan HTTP request logger piped into Winston

const morgan = require("morgan");
const logger = require("../utils/logger");

const SENSITIVE_KEYS = new Set(["password", "token", "authorization"]);

const redact = (value) => {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : redact(val),
      ])
    );
  }
  return value;
};

// Stream morgan output into winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

const loggerMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);

const requestDetailsLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).slice(2, 10);
  req.requestId = requestId;

  logger.info(
    `[${requestId}] -> ${req.method} ${req.originalUrl} body=${JSON.stringify(redact(req.body || {}))}`
  );

  res.on("finish", () => {
    logger.info(
      `[${requestId}] <- ${req.method} ${req.originalUrl} status=${res.statusCode} durationMs=${Date.now() - start}`
    );
  });

  next();
};

module.exports = [loggerMiddleware, requestDetailsLogger];
