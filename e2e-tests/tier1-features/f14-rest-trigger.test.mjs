import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createMockBackendServer } from '../helpers/backend-mock-server.mjs';

describe('Tier 1 - F14: REST Training Trigger', () => {
  let mockServer;
  let baseUrl;

  before(async () => {
    mockServer = createMockBackendServer();
    baseUrl = await mockServer.start();
  });

  after(async () => {
    if (mockServer) await mockServer.stop();
  });

  it('F14-1: Dispatches POST /api/mlp/runPerceptron with JSON payload and returns HTTP 200', async () => {
    const payload = {
      sessionId: crypto.randomUUID(),
      parameters: {
        inputLayer: 4,
        hiddenLayer: 3,
        outputLayer: 3,
        firstClassColumn: 4,
        learningRate: 0.1,
        errorValue: 0.01,
        epochs: 100,
        transferFunction: 'Logistica',
        trainingRate: 0.7,
        sameFileForTesting: true,
      },
      data: [{ f1: 0.1, f2: 0.2, f3: 0.3, f4: 0.4, c1: 1, c2: 0, c3: 0 }],
      dataToTest: null,
    };

    const res = await fetch(`${baseUrl}/api/mlp/runPerceptron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.message, 'OK');
    assert.ok(body.data, 'response must include data object');
  });

  it('F14-2: Response contains arrAvaregeError array and confusionMatrix', async () => {
    const payload = {
      sessionId: crypto.randomUUID(),
      parameters: {
        inputLayer: 4,
        hiddenLayer: 3,
        outputLayer: 3,
        firstClassColumn: 4,
        learningRate: 0.1,
        errorValue: 0.01,
        epochs: 50,
        transferFunction: 'Logistica',
        trainingRate: 0.7,
        sameFileForTesting: true,
      },
      data: [{ f1: 0.5, c1: 1 }],
      dataToTest: null,
    };

    const res = await fetch(`${baseUrl}/api/mlp/runPerceptron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    assert.ok(Array.isArray(body.data.arrAvaregeError));
    assert.ok(Array.isArray(body.data.confusionMatrix));
    assert.strictEqual(typeof body.data.accuracyPercentage, 'number');
    assert.strictEqual(typeof body.data.converged, 'boolean');
  });

  it('F14-3: Missing parameters returns HTTP 400 Bad Request', async () => {
    const invalidPayload = { sessionId: 'bad' };
    const res = await fetch(`${baseUrl}/api/mlp/runPerceptron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.message);
  });

  it('F14-4: Server failure returns HTTP 500 with error message', async () => {
    mockServer.state.simulateFailure = true;
    try {
      const payload = {
        sessionId: 'test',
        parameters: { inputLayer: 1, hiddenLayer: 1, outputLayer: 1, epochs: 10 },
        data: [{}],
      };
      const res = await fetch(`${baseUrl}/api/mlp/runPerceptron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.strictEqual(res.status, 500);
    } finally {
      mockServer.state.simulateFailure = false;
    }
  });

  it('F14-5: Request records session ID correctly for backend correlation', async () => {
    const targetSessionId = 'test-session-record-' + Date.now();
    const payload = {
      sessionId: targetSessionId,
      parameters: { inputLayer: 2, hiddenLayer: 2, outputLayer: 2, epochs: 10 },
      data: [{}],
    };

    await fetch(`${baseUrl}/api/mlp/runPerceptron`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const recorded = mockServer.state.recordedRequests.find((r) => r.sessionId === targetSessionId);
    assert.ok(recorded, 'Session ID must be recorded on backend');
  });
});
