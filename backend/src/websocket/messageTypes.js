const ClientMessageType = {
  START: "voice.start",
  END: "voice.end",
  CANCEL: "voice.cancel",
  PING: "ping"
};

const ServerMessageType = {
  CONNECTED: "connected",
  READY: "voice.ready",
  CHUNK_RECEIVED: "voice.chunk_received",
  PROCESSING: "voice.processing",
  RESPONSE: "voice.response",
  CANCELLED: "voice.cancelled",
  PONG: "pong",
  ERROR: "error"
};

module.exports = { ClientMessageType, ServerMessageType };