// src/modules/users/users.service.js
// User profile operations

const prisma = require("../../config/db");

/**
 * Get user profile by ID
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      language: true,
      village: true,
      district: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Update user profile
 */
const updateUser = async (userId, updateData) => {
  const allowedFields = ["name", "language", "village", "district"];
  const filteredData = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: filteredData,
    select: {
      id: true,
      name: true,
      phone: true,
      language: true,
      village: true,
      district: true,
      updatedAt: true,
    },
  });

  return user;
};

module.exports = { getUserById, updateUser };