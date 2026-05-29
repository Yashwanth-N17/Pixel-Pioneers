const { body, param } = require("express-validator");

const frequencies = ["daily", "weekly", "monthly", "seasonal"];
const seasons = ["kharif", "rabi", "zaid", "festival", "off_season", "monsoon", "harvest", "other"];

const incomeSourcePayloadValidation = [
  body("sourceName").trim().notEmpty().withMessage("sourceName is required."),
  body("amount")
    .notEmpty()
    .withMessage("amount is required.")
    .isFloat({ min: 0 })
    .withMessage("amount must be a non-negative number."),
  body("frequency").isIn(frequencies).withMessage("Invalid income frequency."),
  body("seasonalFlag").optional().isBoolean().withMessage("seasonalFlag must be boolean."),
  body("seasonCategory").optional().isIn(seasons).withMessage("Invalid season category."),
];

const idParam = [param("id").isUUID().withMessage("Income source id must be a valid UUID.")];
const userIdParam = [param("userId").isUUID().withMessage("userId must be a valid UUID.")];

module.exports = {
  incomeSourcePayloadValidation,
  idParam,
  userIdParam,
};
