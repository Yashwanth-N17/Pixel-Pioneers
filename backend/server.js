// server.js
// Entry point — starts HTTP server and connects to DB

require("dotenv").config();
const app = require("./app");
const environment = require("./src/config/environment");
const prisma = require("./src/config/db");
const logger = require("./src/utils/logger");

const PORT = environment.port;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  try {
    // Test database connection
    //await prisma.$connect();
    logger.info("✅ Database connected successfully.");

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 ArthSaathi backend running on port ${PORT}`);
      logger.info(`🌐 Listening on http://${HOST}:${PORT}`);
      logger.info(`📡 Environment: ${environment.nodeEnv}`);
      logger.info(`🤖 AI Service URL: ${environment.ai.serviceUrl}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info("Database disconnected. Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
