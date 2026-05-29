// src/services/aiClient.js
//add this
const axios = require("axios");
const environment = require("../config/environment");

const aiClient = axios.create({
  baseURL: environment.ai.serviceUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Return only response.data
module.exports = {
  post: async (url, data) => {
    const response = await aiClient.post(url, data);
    return response.data;
  },

  get: async (url, config = {}) => {
    const response = await aiClient.get(url, config);
    return response.data;
  },
};