const { WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");
const { config } = require("../config");
const { AudioSessionStore } = require("../services/audioSessionStore");
const { processAudio } = require("../services/aiServiceClient");
const { buildFrontendResponse } = require("../services/responseBuilder");
const { logger } = require("../utils/logger");
const { ClientMessageType, ServerMessageType } = require("./messageTypes");

const sessions = new AudioSessionStore();

function send(socket, type, payload = {}) {
  socket.send(JSON.stringify({ type, ...payload }));
}

function parseJsonMessage(message) {
  try {
    return JSON.parse(message.toString("utf8"));
  } catch {
    return null;
  }
}

function attachVoiceSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws/voice" });

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url, "http://localhost");
    let sessionId = url.searchParams.get("sessionId") || randomUUID();
    const maxBytes = config.maxAudioSizeMb * 1024 * 1024;

    send(socket, ServerMessageType.CONNECTED, { sessionId });

    socket.on("message", async (message, isBinary) => {
      try {
        if (isBinary) {
          const totalBytes = sessions.append(sessionId, Buffer.from(message));

          if (totalBytes > maxBytes) {
            sessions.cancel(sessionId);
            send(socket, ServerMessageType.ERROR, {
              error: `Audio exceeded ${config.maxAudioSizeMb} MB limit.`
            });
            return;
          }

          send(socket, ServerMessageType.CHUNK_RECEIVED, { sessionId, totalBytes });
          return;
        }

        const payload = parseJsonMessage(message);
        if (!payload?.type) {
          send(socket, ServerMessageType.ERROR, { error: "Invalid WebSocket message." });
          return;
        }

        if (payload.type === ClientMessageType.START) {
          sessionId = payload.sessionId || sessionId;

          sessions.start(sessionId, {
            filename: payload.filename || "websocket-audio.wav",
            mimeType: payload.mimeType || "audio/wav"
          });

          send(socket, ServerMessageType.READY, { sessionId });
          return;
        }

        if (payload.type === ClientMessageType.END) {
          const { audioBuffer, metadata, totalBytes } = sessions.finish(sessionId);

          send(socket, ServerMessageType.PROCESSING, { sessionId, totalBytes });

          const aiResult = await processAudio({
            audioBuffer,
            filename: metadata.filename,
            mimeType: metadata.mimeType,
            sessionId
          });

          send(socket, ServerMessageType.RESPONSE, {
            payload: buildFrontendResponse(aiResult)
          });
          return;
        }

        if (payload.type === ClientMessageType.CANCEL) {
          sessions.cancel(sessionId);
          send(socket, ServerMessageType.CANCELLED, { sessionId });
          return;
        }

        if (payload.type === ClientMessageType.PING) {
          send(socket, ServerMessageType.PONG, { sessionId });
        }
      } catch (error) {
        logger.error(error);
        send(socket, ServerMessageType.ERROR, { error: "Voice processing failed." });
      }
    });

    socket.on("close", () => {
      sessions.cancel(sessionId);
    });
  });
}

module.exports = { attachVoiceSocket };

