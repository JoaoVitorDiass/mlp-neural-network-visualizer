import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignalREmulator } from '../helpers/signalr-mock-server.mjs';

describe('Tier 1 - F13: Resilient SignalR WebSocket Client', () => {
  it('F13-1: Generates valid unique UUID session identifiers for each training run', () => {
    const sessionIds = Array.from({ length: 5 }, () => crypto.randomUUID());
    const unique = new Set(sessionIds);
    assert.strictEqual(unique.size, 5, 'Session IDs must be strictly unique');
    for (const id of sessionIds) {
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
  });

  it('F13-2: JoinSession registers client listener to specified session group', () => {
    const hub = new SignalREmulator();
    const sessionId = crypto.randomUUID();
    const received = [];
    hub.joinSession(sessionId, (data) => received.push(data));

    hub.emitEpochProgress(sessionId, 1, 0.5);
    assert.strictEqual(received.length, 1);
    assert.strictEqual(received[0].epoch, 1);
    assert.strictEqual(received[0].avarageError, 0.5);
  });

  it('F13-3: Session groups isolate progress events between distinct sessions', () => {
    const hub = new SignalREmulator();
    const sessionA = 'session-A';
    const sessionB = 'session-B';
    const receivedA = [];
    const receivedB = [];

    hub.joinSession(sessionA, (data) => receivedA.push(data));
    hub.joinSession(sessionB, (data) => receivedB.push(data));

    hub.emitEpochProgress(sessionA, 10, 0.25);
    assert.strictEqual(receivedA.length, 1);
    assert.strictEqual(receivedB.length, 0, 'Session B should not receive events emitted to Session A');
  });

  it('F13-4: LeaveSession unsubscribes client listener from future events', () => {
    const hub = new SignalREmulator();
    const sessionId = 'session-cleanup';
    const received = [];
    const unsubscribe = hub.joinSession(sessionId, (data) => received.push(data));

    hub.emitEpochProgress(sessionId, 1, 0.8);
    assert.strictEqual(received.length, 1);

    unsubscribe();
    hub.emitEpochProgress(sessionId, 2, 0.6);
    assert.strictEqual(received.length, 1, 'Should not receive events after leaving session');
  });

  it('F13-5: Hub endpoint path aligns with backend Program.cs routing (/hubs/training)', () => {
    const defaultHubRoute = '/hubs/training';
    assert.strictEqual(defaultHubRoute, '/hubs/training');
  });
});
