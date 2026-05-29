const axios = require("axios");
const FormData = require("form-data");

const { config } = require("../config");

async function processAudio({ audioBuffer, filename, mimeType, sessionId }) {
  const form = new FormData();

  form.append("audio", audioBuffer, {
    filename,
    contentType: mimeType,
  });

  form.append("session_id", sessionId);

  const response = await axios.post(`${config.aiServiceUrl}/v1/voice/process`, form, {
    headers: form.getHeaders(),
    timeout: 120000,
  });

  return response.data;
}

module.exports = { processAudio };
