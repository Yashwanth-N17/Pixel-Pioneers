// src/middlewares/validate.middleware.js
// Runs express-validator results and returns errors if any

const { validationResult } = require("express-validator");
const { sendError } = require("../utils/apiResponse");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(
      res,
      "Validation failed.",
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }

  next();
};

module.exports = validate;