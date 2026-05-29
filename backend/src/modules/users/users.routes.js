// src/modules/users/users.routes.js

const express = require("express");
const router = express.Router();

const usersController = require("./users.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// All user routes are protected
router.use(authMiddleware);

// GET /api/users/profile
router.get("/profile", usersController.getProfile);

// PUT /api/users/profile
router.put("/profile", usersController.updateProfile);

module.exports = router;