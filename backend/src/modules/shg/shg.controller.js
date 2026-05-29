const shgService = require("./shg.service");
const { sendSuccess } = require("../../utils/apiResponse");

const createGroup = async (req, res, next) => {
  try {
    const group = await shgService.createGroup(req.user.id, req.body);
    return sendSuccess(res, "SHG group created successfully.", group, 201);
  } catch (error) {
    next(error);
  }
};

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await shgService.getMyGroups(req.user.id);
    return sendSuccess(res, "SHG groups fetched successfully.", groups);
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await shgService.getDashboard(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG dashboard fetched successfully.", dashboard);
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await shgService.getMembers(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG members fetched successfully.", members);
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const member = await shgService.addMember(req.user.id, req.params.groupId, req.body);
    return sendSuccess(res, "SHG member added successfully.", member, 201);
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await shgService.getTransactions(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG transactions fetched successfully.", transactions);
  } catch (error) {
    next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await shgService.createTransaction(
      req.user.id,
      req.params.groupId,
      req.body
    );
    return sendSuccess(res, "SHG transaction created successfully.", transaction, 201);
  } catch (error) {
    next(error);
  }
};

const getApprovals = async (req, res, next) => {
  try {
    const approvals = await shgService.getApprovals(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG approvals fetched successfully.", approvals);
  } catch (error) {
    next(error);
  }
};

const approveTransaction = async (req, res, next) => {
  try {
    const result = await shgService.approveTransaction(
      req.user.id,
      req.params.transactionId,
      req.body.remarks
    );
    return sendSuccess(res, "SHG transaction approved successfully.", result);
  } catch (error) {
    next(error);
  }
};

const rejectTransaction = async (req, res, next) => {
  try {
    const result = await shgService.rejectTransaction(
      req.user.id,
      req.params.transactionId,
      req.body.remarks
    );
    return sendSuccess(res, "SHG transaction rejected successfully.", result);
  } catch (error) {
    next(error);
  }
};

const getProposals = async (req, res, next) => {
  try {
    const proposals = await shgService.getProposals(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG proposals fetched successfully.", proposals);
  } catch (error) {
    next(error);
  }
};

const createProposal = async (req, res, next) => {
  try {
    const proposal = await shgService.createProposal(req.user.id, req.params.groupId, req.body);
    return sendSuccess(res, "SHG proposal created successfully.", proposal, 201);
  } catch (error) {
    next(error);
  }
};

const voteOnProposal = async (req, res, next) => {
  try {
    const result = await shgService.voteOnProposal(
      req.user.id,
      req.params.proposalId,
      req.body.vote
    );
    return sendSuccess(res, "SHG vote recorded successfully.", result);
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await shgService.getNotifications(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG notifications fetched successfully.", notifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await shgService.markNotificationRead(
      req.user.id,
      req.params.notificationId
    );
    return sendSuccess(res, "SHG notification marked as read.", notification);
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const auditLogs = await shgService.getAuditLogs(req.user.id, req.params.groupId);
    return sendSuccess(res, "SHG audit logs fetched successfully.", auditLogs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getDashboard,
  getMembers,
  addMember,
  getTransactions,
  createTransaction,
  getApprovals,
  approveTransaction,
  rejectTransaction,
  getProposals,
  createProposal,
  voteOnProposal,
  getNotifications,
  markNotificationRead,
  getAuditLogs,
};
