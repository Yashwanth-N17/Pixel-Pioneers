// src/config/razorpay.js
// Razorpay SDK instance — singleton pattern

const Razorpay = require("razorpay");
const environment = require("./environment");

const razorpayInstance = new Razorpay({
  key_id: environment.razorpay.keyId,
  key_secret: environment.razorpay.keySecret,
});

module.exports = razorpayInstance;