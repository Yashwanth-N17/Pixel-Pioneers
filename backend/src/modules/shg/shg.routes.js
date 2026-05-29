const express = require("express");
const router = express.Router();

const shgController = require("./shg.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const {
  groupIdParam,
  notificationIdParam,
  createGroupValidation,
  addMemberValidation,
  createTransactionValidation,
  approvalActionValidation,
  createProposalValidation,
  voteValidation,
} = require("./shg.validation");

router.use(authMiddleware);

router.post("/groups", createGroupValidation, validate, shgController.createGroup);
router.get("/groups/my", shgController.getMyGroups);
router.get("/groups/:groupId/dashboard", groupIdParam, validate, shgController.getDashboard);
router.get("/groups/:groupId/members", groupIdParam, validate, shgController.getMembers);
router.post("/groups/:groupId/members", addMemberValidation, validate, shgController.addMember);

router.get(
  "/groups/:groupId/transactions",
  groupIdParam,
  validate,
  shgController.getTransactions
);
router.post(
  "/groups/:groupId/transactions",
  createTransactionValidation,
  validate,
  shgController.createTransaction
);

router.get("/groups/:groupId/approvals", groupIdParam, validate, shgController.getApprovals);
router.post(
  "/transactions/:transactionId/approve",
  approvalActionValidation,
  validate,
  shgController.approveTransaction
);
router.post(
  "/transactions/:transactionId/reject",
  approvalActionValidation,
  validate,
  shgController.rejectTransaction
);

router.get("/groups/:groupId/proposals", groupIdParam, validate, shgController.getProposals);
router.post(
  "/groups/:groupId/proposals",
  createProposalValidation,
  validate,
  shgController.createProposal
);
router.post("/proposals/:proposalId/vote", voteValidation, validate, shgController.voteOnProposal);

router.get(
  "/groups/:groupId/notifications",
  groupIdParam,
  validate,
  shgController.getNotifications
);
router.patch(
  "/notifications/:notificationId/read",
  notificationIdParam,
  validate,
  shgController.markNotificationRead
);
router.get("/groups/:groupId/audit-logs", groupIdParam, validate, shgController.getAuditLogs);

module.exports = router;
