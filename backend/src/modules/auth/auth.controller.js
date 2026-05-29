// src/modules/auth/auth.controller.js
// Handles HTTP layer for auth — delegates to auth.service.js

const authService = require("./auth.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, phone, password, language, village, district } = req.body;

    const result = await authService.register({
      name,
      phone,
      password,
      language,
      village,
      district,
    });

    return sendSuccess(res, "Registration successful.", result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { phone, password, village, district } = req.body;

    const result = await authService.login({ phone, password, village, district });

    return sendSuccess(res, "Login successful.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Returns a success response. (For stateless JWTs, local token deletion is enough).
 */
const logout = async (req, res, next) => {
  try {
    // If you implement a Redis token blacklist later, you would add the token here.
    // For standard stateless JWTs, a simple 200 OK is all that's required.
    return sendSuccess(res, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, "Authenticated user fetched.", req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };