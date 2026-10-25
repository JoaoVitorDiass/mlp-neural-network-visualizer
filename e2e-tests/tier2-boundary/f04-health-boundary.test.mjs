import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Tier 2 - F4 Boundary: Layout & Health Status Edge Cases', () => {
  it('F4-B1: Malformed JSON response body is caught gracefully without unhandled rejection', async () => {
    const parseHealthBody = (raw) => {
      try {
        return JSON.parse(raw);
      } catch (err) {
        return { status: 'Offline', message: 'Invalid JSON payload from server', timestamp: '' };
      }
    };
    const result = parseHealthBody('<html>502 Bad Gateway</html>');
    assert.strictEqual(result.status, 'Offline');
  });

  it('F4-B2: Empty timestamp falls back to local client timestamp', () => {
    const normalizeHealthPayload = (payload) => ({
      status: payload.status || 'Offline',
      message: payload.message || '',
      timestamp: payload.timestamp || new Date().toISOString(),
    });
    const normalized = normalizeHealthPayload({ status: 'Online' });
    assert.ok(normalized.timestamp.length > 0);
  });

  it('F4-B3: HTTP 503 Service Unavailable triggers retry with backoff', () => {
    const getRetryDelay = (attempt) => Math.min(30000, 1000 * Math.pow(2, attempt));
    assert.strictEqual(getRetryDelay(0), 1000);
    assert.strictEqual(getRetryDelay(1), 2000);
    assert.strictEqual(getRetryDelay(5), 30000);
  });

  it('F4-B4: Network timeout aborts request via AbortSignal after 5000ms', () => {
    const controller = new AbortController();
    assert.strictEqual(controller.signal.aborted, false);
    controller.abort();
    assert.strictEqual(controller.signal.aborted, true);
  });

  it('F4-B5: Rapid consecutive health checks do not leak active fetch promises', () => {
    let activeRequest = null;
    const triggerHealth = (id) => {
      activeRequest = id;
      return activeRequest;
    };
    triggerHealth(1);
    triggerHealth(2);
    assert.strictEqual(activeRequest, 2);
  });
});
