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

  if (!member || member.status !== "active") {
    throw makeError("You are not an active member of this SHG group.", 403);
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
    },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
};

const createGroup = async (userId, payload) => {
  // Generate a name-based invite code: first 3 letters of group name (uppercased) + 3 random digits
  // e.g. "Sri Lakshmi SHG" → "SRI" + "847" = "SRI847"
  const prefix = payload.name
    .replace(/[^a-zA-Z]/g, '')  // strip non-letters
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');             // pad to 3 chars if name is too short
  const suffix = Math.floor(100 + Math.random() * 900).toString(); // 3 digit number
  const inviteCode = `${prefix}${suffix}`;

  return prisma.$transaction(async (tx) => {
    const group = await tx.shgGroup.create({
      data: {
        name: payload.name,
        createdById: userId,
        inviteCode,
        maxMembers: payload.maxMembers || 10,
        earlyExitFine: payload.earlyExitFine || 0,
        members: {
          create: {
            userId,
            role: "admin",
            status: "active",
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

const joinGroup = async (userId, inviteCode) => {
  return prisma.$transaction(async (tx) => {
    const group = await tx.shgGroup.findFirst({
      where: { inviteCode },
      include: { members: true },
    });

    if (!group) {
      throw makeError("Invalid invite code or group not found.", 404);
    }

    if (group.members.length >= group.maxMembers) {
      throw makeError(`This SHG group has reached its member limit of ${group.maxMembers}.`, 403);
    }

    const existingMember = group.members.find((m) => m.userId === userId);
    if (existingMember) {
      if (existingMember.status === "pending") {
        throw makeError("Your join request is already pending admin approval.", 409);
      }
      throw makeError("You are already a member of this group.", 409);
    }

    const newMember = await tx.shgMember.create({
      data: {
        groupId: group.id,
        userId,
        role: "member",
        status: "pending",
      },
    });

    await logAudit(tx, group.id, userId, "join_request_created", {
      inviteCode,
    });

    const admins = group.members.filter(m => m.role === "admin");
    await notifyUsers(
      tx,
      group.id,
      admins.map(a => a.userId),
      "A new user has requested to join the SHG group."
    );

    return group;
  });
};

const approveJoinRequest = async (adminId, groupId, targetUserId) => {
  return prisma.$transaction(async (tx) => {
    const adminMember = await tx.shgMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== "admin") {
      throw makeError("Only group admins can approve join requests.", 403);
    }

    const targetMember = await tx.shgMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== "pending") {
      throw makeError("Join request not found or already processed.", 404);
    }

    const group = await tx.shgGroup.findUnique({
      where: { id: groupId },
      include: { members: { where: { status: { in: ["active", "pending"] } } } },
    });

    if (group.members.filter(m => m.status === "active").length >= group.maxMembers) {
      throw makeError(`This SHG group has reached its active member limit of ${group.maxMembers}.`, 403);
    }

    const updatedMember = await tx.shgMember.update({
      where: { id: targetMember.id },
      data: { status: "active" },
    });

    await notifyUsers(tx, groupId, [targetUserId], "Your request to join the SHG group has been approved.");
    
    return updatedMember;
  });
};

const rejectJoinRequest = async (adminId, groupId, targetUserId) => {
  return prisma.$transaction(async (tx) => {
    const adminMember = await tx.shgMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== "admin") {
      throw makeError("Only group admins can reject join requests.", 403);
    }

    const targetMember = await tx.shgMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== "pending") {
      throw makeError("Join request not found or already processed.", 404);
    }

    await tx.shgMember.delete({
      where: { id: targetMember.id },
    });

    await notifyUsers(tx, groupId, [targetUserId], "Your request to join the SHG group was rejected.");

    return { message: "Join request rejected successfully." };
  });
};

const getJoinRequests = async (adminId, groupId) => {
  const adminMember = await prisma.shgMember.findUnique({
    where: { groupId_userId: { groupId, userId: adminId } },
  });

  if (!adminMember || adminMember.role !== "admin") {
    throw makeError("Only group admins can view join requests.", 403);
  }

  return prisma.shgMember.findMany({
    where: { groupId, status: "pending" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { joinedAt: "desc" },
  });
};

const leaveGroup = async (userId, groupId) => {
  return prisma.$transaction(async (tx) => {
    const member = await requireMember(tx, groupId, userId);
    
    const group = await tx.shgGroup.findUnique({
      where: { id: groupId }
    });

    // Chit Fund Logic: Check term
    const termMonths = group.maxMembers;
    const termEndDate = new Date(group.createdAt);
    termEndDate.setMonth(termEndDate.getMonth() + termMonths);
    const isTermActive = new Date() < termEndDate;

    if (isTermActive) {
      // Check if user has withdrawn money
      const withdrawals = await tx.shgTransaction.findMany({
        where: {
          groupId,
          createdById: userId,
          type: "withdrawal",
          status: "executed",
        }
      });

      if (withdrawals.length > 0) {
        throw makeError(`Cannot leave group before term ends (${termEndDate.toLocaleDateString()}) because you have withdrawn money.`, 403);
      }
      
      // Calculate deposits to see if they can pay the fine
      const deposits = await tx.shgTransaction.aggregate({
        where: {
          groupId,
          createdById: userId,
          type: "deposit",
          status: "executed",
        },
        _sum: { amount: true },
      });
      const totalDeposited = deposits._sum.amount || 0;
      
      if (group.earlyExitFine > 0) {
        if (totalDeposited < group.earlyExitFine) {
          throw makeError(`Cannot leave early. You need at least ₹${group.earlyExitFine} in deposits to cover the early exit fine.`, 400);
        }
        
        // Log fine payment
        await tx.shgTransaction.create({
          data: {
            groupId,
            createdById: userId,
            type: "deposit", // It stays in the group as a fine collected
            amount: group.earlyExitFine,
            status: "executed",
            description: "Early exit fine forfeited to group.",
          }
        });
      }
      
      // Deduct the rest of their money from the group balance as a refund
      const refundAmount = totalDeposited - group.earlyExitFine;
      if (refundAmount > 0) {
        await tx.shgGroup.update({
          where: { id: groupId },
          data: { totalBalance: { decrement: refundAmount } },
        });
        
        await tx.shgTransaction.create({
          data: {
            groupId,
            createdById: userId,
            type: "withdrawal",
            amount: refundAmount,
            status: "executed",
            description: "Refund of deposits upon leaving group (after fine).",
          }
        });
      }
    }

    // Remove member
    await tx.shgMember.delete({
      where: { id: member.id },
    });

    await logAudit(tx, groupId, userId, "member_left", {
      memberId: member.id,
      userId,
      appliedFine: isTermActive ? group.earlyExitFine : 0,
    });

    // Notify others
    const remainingMembers = await getGroupUserIds(tx, groupId);
    await notifyUsers(tx, groupId, remainingMembers, `A member has left the SHG group.`);

    return { message: "Successfully left the group." };
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

    if (type === "withdrawal") {
      // Any member can create withdrawal requests, no role restriction anymore
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

    const existingVote = proposal.votes.find((v) => v.userId === userId);
    if (existingVote) {
      throw makeError("You have already voted on this proposal.", 409);
    }

    return tx.shgVote.create({
      data: {
        proposalId,
        userId,
        vote,
      },
    });
  });
};

const removeMember = async (actorId, groupId, targetUserId) => {
  return prisma.$transaction(async (tx) => {
    const actorMembership = await requireMember(tx, groupId, actorId);
    if (!ADMIN_ROLES.has(actorMembership.role)) {
      throw makeError("Only group office bearers can remove members.", 403);
    }

    const targetMember = await tx.shgMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw makeError("The target user is not a member of this group.", 404);
    }

    await tx.shgMember.delete({
      where: { id: targetMember.id },
    });

    await logAudit(tx, groupId, actorId, "member_removed", {
      removedUserId: targetUserId,
    });

    await notifyUsers(tx, groupId, [targetUserId], "You have been removed from the SHG group.");

    return { success: true, message: "Member removed successfully." };
  });
};

module.exports = {
  createGroup,
  getMyGroups,
  joinGroup,
  getDashboard,
  getMembers,
  addMember,
  joinGroup,
  leaveGroup,
  getTransactions,
  createTransaction,
  getApprovals,
  approveTransaction,
  rejectTransaction,
  getProposals,
  createProposal,
  voteOnProposal,
  removeMember,
};