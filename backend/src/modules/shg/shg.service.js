const prisma = require("../../config/db");

const DEFAULT_APPROVAL_THRESHOLD = 2;
const WITHDRAWAL_ROLES = new Set(["treasurer", "president", "admin"]);
const ADMIN_ROLES = new Set(["treasurer", "president", "admin"]);

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getApprovalThreshold = (transaction) => {
  const threshold = Number(transaction.metadata?.approvalThreshold);
  return Number.isInteger(threshold) && threshold > 0
    ? threshold
    : DEFAULT_APPROVAL_THRESHOLD;
};

const requireMember = async (client, groupId, userId) => {
  const member = await client.shgMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!member) {
    throw makeError("You are not a member of this SHG group.", 403);
  }

  return member;
};

const logAudit = (client, groupId, actorId, actionType, payload = {}) => {
  return client.shgAuditLog.create({
    data: { groupId, actorId, actionType, payload },
  });
};

const notifyUsers = async (client, groupId, userIds, message) => {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueUserIds.length === 0) return;

  await client.shgNotification.createMany({
    data: uniqueUserIds.map((userId) => ({ groupId, userId, message })),
  });
};

const getGroupUserIds = async (client, groupId, excludeUserId = null) => {
  const members = await client.shgMember.findMany({
    where: excludeUserId ? { groupId, userId: { not: excludeUserId } } : { groupId },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
};

const getApprovalUserIds = async (client, groupId, creatorId) => {
  const members = await client.shgMember.findMany({
    where: {
      groupId,
      userId: { not: creatorId },
      role: { in: ["treasurer", "president", "admin"] },
    },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
};

const createGroup = async (userId, payload) => {
  return prisma.$transaction(async (tx) => {
    const group = await tx.shgGroup.create({
      data: {
        name: payload.name,
        createdById: userId,
        members: {
          create: {
            userId,
            role: "admin",
            trustScore: 100,
          },
        },
      },
      include: { members: true },
    });

    await logAudit(tx, group.id, userId, "group_created", {
      name: group.name,
    });

    return group;
  });
};

const getMyGroups = async (userId) => {
  return prisma.shgGroup.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        where: { userId },
        select: { role: true, trustScore: true, joinedAt: true },
      },
      _count: {
        select: { members: true, transactions: true, proposals: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getDashboard = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  const [group, pendingWithdrawals, recentTransactions, openProposals, unreadNotifications] =
    await Promise.all([
      prisma.shgGroup.findUnique({
        where: { id: groupId },
        include: { _count: { select: { members: true } } },
      }),
      prisma.shgTransaction.aggregate({
        where: { groupId, type: "withdrawal", status: "pending" },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.shgTransaction.findMany({
        where: { groupId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { createdBy: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.shgProposal.count({ where: { groupId, status: "open" } }),
      prisma.shgNotification.count({
        where: { groupId, userId, readStatus: false },
      }),
    ]);

  if (!group) throw makeError("SHG group not found.", 404);

  return {
    group,
    pendingWithdrawals: {
      count: pendingWithdrawals._count.id,
      amount: pendingWithdrawals._sum.amount || 0,
    },
    recentTransactions,
    openProposals,
    unreadNotifications,
  };
};

const getMembers = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, phone: true, village: true } } },
    orderBy: { joinedAt: "asc" },
  });
};

const addMember = async (actorId, groupId, payload) => {
  return prisma.$transaction(async (tx) => {
    const actorMembership = await requireMember(tx, groupId, actorId);
    if (!ADMIN_ROLES.has(actorMembership.role)) {
      throw makeError("Only group office bearers can add members.", 403);
    }

    const member = await tx.shgMember.create({
      data: {
        groupId,
        userId: payload.userId,
        role: payload.role || "member",
        trustScore: payload.trustScore === undefined ? 0 : Number(payload.trustScore),
      },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    await logAudit(tx, groupId, actorId, "member_added", {
      memberId: member.id,
      userId: member.userId,
      role: member.role,
    });
    await notifyUsers(tx, groupId, [payload.userId], "You have been added to an SHG group.");

    return member;
  });
};

const getTransactions = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgTransaction.findMany({
    where: { groupId },
    include: {
      createdBy: { select: { id: true, name: true, phone: true } },
      approvals: {
        include: { approver: { select: { id: true, name: true, phone: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const createTransaction = async (userId, groupId, payload) => {
  return prisma.$transaction(async (tx) => {
    const member = await requireMember(tx, groupId, userId);
    const type = payload.type;
    const amount = Number(payload.amount);

    if (type === "withdrawal" && !WITHDRAWAL_ROLES.has(member.role)) {
      throw makeError("Only treasurer, president, or admin can create withdrawal requests.", 403);
    }

    const immediateApproval = type !== "withdrawal";
    const status = immediateApproval ? "approved" : "pending";
    const transaction = await tx.shgTransaction.create({
      data: {
        groupId,
        createdById: userId,
        type,
        amount,
        status,
        description: payload.description || null,
        metadata: payload.metadata || {},
      },
    });

    if (immediateApproval) {
      await tx.shgGroup.update({
        where: { id: groupId },
        data: { totalBalance: { increment: amount } },
      });
      await logAudit(tx, groupId, userId, "transaction_approved", {
        transactionId: transaction.id,
        type,
        amount,
      });
    } else {
      const approverIds = await getApprovalUserIds(tx, groupId, userId);
      await notifyUsers(
        tx,
        groupId,
        approverIds,
        `Withdrawal request needs approval: ${payload.description || "SHG withdrawal"}`
      );
    }

    await logAudit(tx, groupId, userId, "transaction_created", {
      transactionId: transaction.id,
      type,
      amount,
      status,
    });

    return transaction;
  });
};

const getApprovals = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgTransaction.findMany({
    where: { groupId, type: "withdrawal", status: "pending" },
    include: {
      createdBy: { select: { id: true, name: true, phone: true } },
      approvals: {
        include: { approver: { select: { id: true, name: true, phone: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

const approveTransaction = async (userId, transactionId, remarks) => {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.shgTransaction.findUnique({
      where: { id: transactionId },
      include: { group: true },
    });

    if (!transaction) throw makeError("SHG transaction not found.", 404);
    const member = await requireMember(tx, transaction.groupId, userId);

    if (transaction.createdById === userId) {
      throw makeError("Approver cannot approve their own transaction.", 403);
    }
    if (!ADMIN_ROLES.has(member.role)) {
      throw makeError("Only group office bearers can approve withdrawals.", 403);
    }
    if (transaction.status !== "pending") {
      throw makeError("Only pending transactions can be approved.", 400);
    }

    const existingApproval = await tx.shgApproval.findUnique({
      where: { transactionId_approverId: { transactionId, approverId: userId } },
    });
    if (existingApproval) {
      throw makeError("You have already reviewed this transaction.", 409);
    }

    const approval = await tx.shgApproval.create({
      data: {
        transactionId,
        approverId: userId,
        status: "approved",
        remarks: remarks || null,
      },
    });

    await logAudit(tx, transaction.groupId, userId, "transaction_approved", {
      transactionId,
      approvalId: approval.id,
    });

    const approvalCount = await tx.shgApproval.count({
      where: { transactionId, status: "approved" },
    });
    const threshold = getApprovalThreshold(transaction);

    let updatedTransaction = transaction;
    if (approvalCount >= threshold) {
      const group = await tx.shgGroup.findUnique({ where: { id: transaction.groupId } });
      if (!group) throw makeError("SHG group not found.", 404);
      if (group.totalBalance < transaction.amount) {
        throw makeError("Insufficient SHG balance to execute this withdrawal.", 400);
      }

      updatedTransaction = await tx.shgTransaction.update({
        where: { id: transactionId },
        data: { status: "executed" },
      });
      await tx.shgGroup.update({
        where: { id: transaction.groupId },
        data: { totalBalance: { decrement: transaction.amount } },
      });
      await logAudit(tx, transaction.groupId, userId, "transaction_executed", {
        transactionId,
        approvalCount,
        threshold,
      });

      const memberIds = await getGroupUserIds(tx, transaction.groupId);
      await notifyUsers(
        tx,
        transaction.groupId,
        memberIds,
        "An SHG withdrawal has been approved and executed."
      );
    }

    return { transaction: updatedTransaction, approval, approvalCount, threshold };
  });
};

const rejectTransaction = async (userId, transactionId, remarks) => {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.shgTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw makeError("SHG transaction not found.", 404);
    const member = await requireMember(tx, transaction.groupId, userId);

    if (transaction.createdById === userId) {
      throw makeError("Approver cannot reject their own transaction.", 403);
    }
    if (!ADMIN_ROLES.has(member.role)) {
      throw makeError("Only group office bearers can reject withdrawals.", 403);
    }
    if (transaction.status !== "pending") {
      throw makeError("Only pending transactions can be rejected.", 400);
    }

    const existingApproval = await tx.shgApproval.findUnique({
      where: { transactionId_approverId: { transactionId, approverId: userId } },
    });
    if (existingApproval) {
      throw makeError("You have already reviewed this transaction.", 409);
    }

    const approval = await tx.shgApproval.create({
      data: {
        transactionId,
        approverId: userId,
        status: "rejected",
        remarks: remarks || null,
      },
    });
    const updatedTransaction = await tx.shgTransaction.update({
      where: { id: transactionId },
      data: { status: "rejected" },
    });

    await logAudit(tx, transaction.groupId, userId, "transaction_rejected", {
      transactionId,
      approvalId: approval.id,
    });
    const memberIds = await getGroupUserIds(tx, transaction.groupId);
    await notifyUsers(tx, transaction.groupId, memberIds, "An SHG transaction was rejected.");

    return { transaction: updatedTransaction, approval };
  });
};

const getProposals = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgProposal.findMany({
    where: { groupId },
    include: {
      createdBy: { select: { id: true, name: true, phone: true } },
      votes: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

const createProposal = async (userId, groupId, payload) => {
  return prisma.$transaction(async (tx) => {
    await requireMember(tx, groupId, userId);

    const proposal = await tx.shgProposal.create({
      data: {
        groupId,
        createdById: userId,
        title: payload.title,
        description: payload.description || null,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
      },
    });

    await logAudit(tx, groupId, userId, "proposal_created", {
      proposalId: proposal.id,
      title: proposal.title,
    });
    const memberIds = await getGroupUserIds(tx, groupId, userId);
    await notifyUsers(tx, groupId, memberIds, `New SHG proposal: ${proposal.title}`);

    return proposal;
  });
};

const voteOnProposal = async (userId, proposalId, vote) => {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.shgProposal.findUnique({
      where: { id: proposalId },
      include: { votes: true },
    });

    if (!proposal) throw makeError("SHG proposal not found.", 404);
    await requireMember(tx, proposal.groupId, userId);

    if (proposal.status !== "open") {
      throw makeError("Voting is closed for this proposal.", 400);
    }
    if (proposal.deadline && proposal.deadline < new Date()) {
      const expiredProposal = await tx.shgProposal.update({
        where: { id: proposalId },
        data: { status: "expired" },
      });
      await logAudit(tx, proposal.groupId, userId, "proposal_expired", { proposalId });
      throw makeError("Voting deadline has passed for this proposal.", 400);
    }

    const savedVote = await tx.shgVote.upsert({
      where: { proposalId_userId: { proposalId, userId } },
      update: { vote },
      create: { proposalId, userId, vote },
    });

    await logAudit(tx, proposal.groupId, userId, "proposal_vote_cast", {
      proposalId,
      vote,
    });

    const [memberCount, votes] = await Promise.all([
      tx.shgMember.count({ where: { groupId: proposal.groupId } }),
      tx.shgVote.findMany({ where: { proposalId } }),
    ]);

    let updatedProposal = proposal;
    if (votes.length >= memberCount) {
      const yesVotes = votes.filter((item) => item.vote === "yes").length;
      const noVotes = votes.length - yesVotes;
      const status = yesVotes > noVotes ? "passed" : "rejected";

      updatedProposal = await tx.shgProposal.update({
        where: { id: proposalId },
        data: { status },
      });
      await logAudit(tx, proposal.groupId, userId, "proposal_result", {
        proposalId,
        yesVotes,
        noVotes,
        status,
      });

      const memberIds = await getGroupUserIds(tx, proposal.groupId);
      await notifyUsers(
        tx,
        proposal.groupId,
        memberIds,
        `SHG proposal "${proposal.title}" ${status}.`
      );
    }

    return { proposal: updatedProposal, vote: savedVote, voteCount: votes.length };
  });
};

const getNotifications = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgNotification.findMany({
    where: { groupId, userId },
    orderBy: { createdAt: "desc" },
  });
};

const markNotificationRead = async (userId, notificationId) => {
  const notification = await prisma.shgNotification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) throw makeError("SHG notification not found.", 404);

  return prisma.shgNotification.update({
    where: { id: notificationId },
    data: { readStatus: true },
  });
};

const getAuditLogs = async (userId, groupId) => {
  await requireMember(prisma, groupId, userId);

  return prisma.shgAuditLog.findMany({
    where: { groupId },
    include: { actor: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
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
