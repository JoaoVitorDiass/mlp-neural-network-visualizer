/**
 * SignalR Protocol Emulator:
 * Emulates the Hub handshake, negotiation, JoinSession, and ReceiveEpochProgress emissions.
 */
export class SignalREmulator {
  constructor() {
    this.sessions = new Map(); // sessionId -> Set of listener callbacks
    this.globalListeners = new Set();
  }

  joinSession(sessionId, listener) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId).add(listener);
    return () => this.leaveSession(sessionId, listener);
  }

  leaveSession(sessionId, listener) {
    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId).delete(listener);
    }
  }

  emitEpochProgress(sessionId, epoch, avarageError) {
    const payload = { epoch, avarageError };
    if (sessionId && this.sessions.has(sessionId)) {
      for (const cb of this.sessions.get(sessionId)) {
        cb(payload);
      }
    } else {
      for (const cb of this.globalListeners) {
        cb(payload);
      }
    }
  }
}
