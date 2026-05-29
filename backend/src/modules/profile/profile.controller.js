// src/modules/profile/profile.controller.js
// HTTP layer for occupation-based profile onboarding

const profileService = require("./profile.service");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

/**
 * POST /api/profile/farmer
 */
const createFarmerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.createFarmerProfile(userId, req.body);
    return sendSuccess(res, "Farmer profile created successfully.", result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/shop
 */
const createShopProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.createShopProfile(userId, req.body);
    return sendSuccess(res, "Shop profile created successfully.", result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/tailor
 */
const createTailorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.createTailorProfile(userId, req.body);
    return sendSuccess(res, "Tailor profile created successfully.", result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/generic
 */
const createGenericProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.createGenericProfile(userId, req.body);
    return sendSuccess(
      res,
      "Daily wage worker profile created successfully.",
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profile/me
 */
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.getProfileByUserId(userId);
    return sendSuccess(res, "Profile fetched successfully.", result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/me
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await profileService.updateProfile(userId, req.body);
    return sendSuccess(res, "Profile updated successfully.", result);
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createFarmerProfile,
  createShopProfile,
  createTailorProfile,
  createGenericProfile,
  getMyProfile,
  updateMyProfile,
};