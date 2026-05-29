const express = require("express");
const router = express.Router();

const incomeSourceController = require("./incomeSource.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  incomeSourcePayloadValidation,
  idParam,
  userIdParam,
} = require("./incomeSource.validation");

router.use(authMiddleware);

router.post("/", incomeSourcePayloadValidation, validate, incomeSourceController.createIncomeSource);
router.get("/:userId", userIdParam, validate, incomeSourceController.getIncomeSourcesByUser);
router.put("/:id", idParam, incomeSourcePayloadValidation, validate, incomeSourceController.updateIncomeSource);
router.delete("/:id", idParam, validate, incomeSourceController.deleteIncomeSource);

module.exports = router;
