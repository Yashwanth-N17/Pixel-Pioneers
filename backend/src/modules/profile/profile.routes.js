// src/modules/profile/profile.routes.js

const express = require("express");
const router = express.Router();

const profileController = require("./profile.controller");
const {
  farmerProfileValidation,
  shopProfileValidation,
  tailorProfileValidation,
  genericProfileValidation,
  updateProfileValidation,
} = require("./profile.validation");
const validate = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");

// All profile routes require authentication
router.use(authMiddleware);

// GET /api/profile/me
router.get("/me", profileController.getMyProfile);

// PUT /api/profile/me
router.put(
  "/me",
  updateProfileValidation,
  validate,
  profileController.updateMyProfile
);

// POST /api/profile/farmer
router.post(
  "/farmer",
  farmerProfileValidation,
  validate,
  profileController.createFarmerProfile
);

// POST /api/profile/shop
router.post(
  "/shop",
  shopProfileValidation,
  validate,
  profileController.createShopProfile
);

// POST /api/profile/tailor
router.post(
  "/tailor",
  tailorProfileValidation,
  validate,
  profileController.createTailorProfile
);

// POST /api/profile/generic
router.post(
  "/generic",
  genericProfileValidation,
  validate,
  profileController.createGenericProfile
);

module.exports = router;