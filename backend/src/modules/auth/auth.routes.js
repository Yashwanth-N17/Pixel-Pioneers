// src/modules/auth/auth.routes.js

const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { registerValidation, loginValidation } = require("./auth.validation");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");

// POST /api/auth/register
router.post("/register", registerValidation, validate, authController.register);

// POST /api/auth/login
router.post("/login", loginValidation, validate, authController.login);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// GET /api/auth/me  (protected)
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;