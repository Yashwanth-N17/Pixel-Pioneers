// src/modules/chat/chat.validation.js

const { body } = require("express-validator");

const textMessageValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message cannot be empty.")
    .isLength({ max: 2000 })
    .withMessage("Message must not exceed 2000 characters."),

  body("language")
    .optional()
    .isIn(["en", "hi", "kn", "te", "ta", "mr"])
    .withMessage("Unsupported language code."),

  body("context")
    .optional()
    .isObject()
    .withMessage("Context must be an object if provided."),
];

module.exports = { textMessageValidation };