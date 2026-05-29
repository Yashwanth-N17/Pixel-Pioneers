// src/modules/users/users.controller.js

const usersService = require("./users.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    return sendSuccess(res, "Profile fetched successfully.", user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.user.id, req.body);
    return sendSuccess(res, "Profile updated successfully.", user);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };