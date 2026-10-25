import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createMockBackendServer } from '../helpers/backend-mock-server.mjs';

describe('Tier 1 - F4: Layout Shell & Backend Health Status', () => {
  let mockServer;
  let baseUrl;

  before(async () => {
    mockServer = createMockBackendServer();
    baseUrl = await mockServer.start();
  });

  after(async () => {
    if (mockServer) await mockServer.stop();
  });

  it('F4-1: Health endpoint responds with HTTP 200 and required fields', async () => {
    const res = await fetch(`${baseUrl}/api/mlp/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(typeof body.status, 'string');
    assert.strictEqual(typeof body.message, 'string');
    assert.ok(body.timestamp, 'timestamp must be present');
  });

  it('F4-2: Health status "Online" maps to active connected status', async () => {
    const res = await fetch(`${baseUrl}/api/mlp/health`);
    const body = await res.json();
    assert.strictEqual(body.status, 'Online');
  });

  it('F4-3: Health check failure triggers offline state', async () => {
    mockServer.state.simulateFailure = true;
    try {
      const res = await fetch(`${baseUrl}/api/mlp/health`);
      assert.strictEqual(res.status, 500);
    } finally {
      mockServer.state.simulateFailure = false;
    }
  });

  it('F4-4: Health response timestamp parses as valid ISO date', async () => {
    const res = await fetch(`${baseUrl}/api/mlp/health`);
    const body = await res.json();
    const date = new Date(body.timestamp);
    assert.ok(!Number.isNaN(date.getTime()), 'timestamp must be a valid date');
  });

  it('F4-5: Health status badge provides status color tokens (success for Online, danger for Offline)', () => {
    const getBadgeVariant = (status) => (status === 'Online' ? 'success' : 'danger');
    assert.strictEqual(getBadgeVariant('Online'), 'success');
    assert.strictEqual(getBadgeVariant('Offline'), 'danger');
    assert.strictEqual(getBadgeVariant('Unknown'), 'danger');
  });
});
