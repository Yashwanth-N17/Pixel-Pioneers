const { body, param } = require("express-validator");

const shgRoles = ["treasurer", "president", "member", "admin"];
const transactionTypes = ["deposit", "withdrawal", "loan_repayment"];
const voteValues = ["yes", "no"];

const groupIdParam = [
  param("groupId").isUUID().withMessage("groupId must be a valid UUID."),
];

const transactionIdParam = [
  param("transactionId").isUUID().withMessage("transactionId must be a valid UUID."),
];

const proposalIdParam = [
  param("proposalId").isUUID().withMessage("proposalId must be a valid UUID."),
];

const notificationIdParam = [
  param("notificationId").isUUID().withMessage("notificationId must be a valid UUID."),
];

const createGroupValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Group name is required.")
    .isLength({ max: 120 })
    .withMessage("Group name must be 120 characters or fewer."),
];

const addMemberValidation = [
  ...groupIdParam,
  body("userId").isUUID().withMessage("userId must be a valid UUID."),
  body("role")
    .optional()
    .isIn(shgRoles)
    .withMessage("Invalid SHG member role."),
  body("trustScore")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("trustScore must be between 0 and 100."),
];

const createTransactionValidation = [
  ...groupIdParam,
  body("type")
    .isIn(transactionTypes)
    .withMessage("Invalid SHG transaction type."),
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than 0."),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string."),
  body("metadata")
    .optional()
    .isObject()
    .withMessage("metadata must be an object."),
  body("metadata.approvalThreshold")
    .optional()
    .isInt({ min: 1 })
    .withMessage("approvalThreshold must be at least 1."),
];

const approvalActionValidation = [
  ...transactionIdParam,
  body("remarks")
    .optional()
    .isString()
    .withMessage("Remarks must be a string."),
];

const createProposalValidation = [
  ...groupIdParam,
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Proposal title is required.")
    .isLength({ max: 180 })
    .withMessage("Proposal title must be 180 characters or fewer."),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string."),
  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid ISO date."),
];

const voteValidation = [
  ...proposalIdParam,
  body("vote")
    .isIn(voteValues)
    .withMessage("Vote must be yes or no."),
];

module.exports = {
  groupIdParam,
  transactionIdParam,
  proposalIdParam,
  notificationIdParam,
  createGroupValidation,
  addMemberValidation,
  createTransactionValidation,
  approvalActionValidation,
  createProposalValidation,
  voteValidation,
};
