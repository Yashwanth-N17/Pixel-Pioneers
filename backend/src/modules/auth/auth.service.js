// src/modules/auth/auth.service.js
// Business logic for registration and login

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");
const environment = require("../../config/environment");

/**
 * Register a new user
 */
const register = async ({ name, phone, password, language, village, district }) => {
  // Check if phone already registered
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    const error = new Error("Phone number already registered.");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashedPassword,
      language: language || "en",
      village: village || null,
      district: district || null,
    },
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

  // Generate JWT
  const token = generateToken(user.id);

  return { user, token };
};

/**
 * Login an existing user
 */
const login = async ({ phone, password, village, district }) => {
  // Find user by phone
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    const error = new Error("Invalid phone number or password.");
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid phone number or password.");
    error.statusCode = 401;
    throw error;
  }

  // Update location if provided
  let updatedUser = user;
  if (village || district) {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(village && { village }),
        ...(district && { district }),
      },
    });
  }

  // Generate JWT
  const token = generateToken(updatedUser.id);

  // Return user without password
  const { password: _, ...userWithoutPassword } = updatedUser;

  return { user: userWithoutPassword, token };
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, environment.jwt.secret, {
    expiresIn: environment.jwt.expiresIn,
  });
};

module.exports = { register, login };