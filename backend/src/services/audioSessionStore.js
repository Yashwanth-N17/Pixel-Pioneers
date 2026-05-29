class AudioSessionStore {
  constructor() {
    this.sessions = new Map();
  }

  start(sessionId, metadata = {}) {
    this.sessions.set(sessionId, {
      metadata,
      chunks: [],
      totalBytes: 0
    });
  }

  append(sessionId, chunk) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Voice session has not started.");

    session.chunks.push(chunk);
    session.totalBytes += chunk.length;
    return session.totalBytes;
  }

  finish(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Voice session has not started.");

    const audioBuffer = Buffer.concat(session.chunks, session.totalBytes);
    this.sessions.delete(sessionId);

    return {
      audioBuffer,
      metadata: session.metadata,
      totalBytes: session.totalBytes
    };
  }

  cancel(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = { AudioSessionStore };