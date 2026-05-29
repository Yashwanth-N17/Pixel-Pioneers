// src/middlewares/auth.middleware.js
// Verifies JWT token on protected routes

const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");
const environment = require("../config/environment");
const prisma = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Access denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, environment.jwt.secret);

    // Check user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, phone: true, email: true, language: true },
    });

    if (!user) {
      return sendError(res, "User no longer exists.", 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token.", 401);
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token expired. Please login again.", 401);
    }
    return sendError(res, "Authentication failed.", 500);
  }
};

module.exports = authMiddleware;