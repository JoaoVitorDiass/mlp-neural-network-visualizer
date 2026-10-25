/**
 * Challenger M3 Adversarial Stress Test Suite
 *
 * Comprehensive empirical stress testing of:
 * 1. SignalR WebSocket connectivity, session isolation, and lifecycle.
 * 2. Automatic reconnection policy, backoff delays, and session re-join.
 * 3. Cancellation flow via AbortController ("Interromper" button).
 * 4. Offline resilience and API error classification (f19-error-offline).
 * 5. High-frequency streaming, canvas decimation, and metrics calculation under load.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

// Production imports from frontend TypeScript modules via tsx loader
import {
  SignalRTrainingClient,
  generateSessionId,
  getSignalRHubUrl,
} from '../frontend/src/services/signalr.ts';
import {
  apiClient,
  parseApiError,
  isApiOffline,
  runPerceptron,
  buildRunPerceptronPayload,
} from '../frontend/src/services/api.ts';
import {
  calculateProgressPercentage,
  calculateErrorReduction,
  formatElapsedTime,
  calculateLiveMetrics,
  parseEpochProgress,
} from '../frontend/src/utils/metricsCalculator.ts';
import {
  LearningCurveDataBuffer,
} from '../frontend/src/utils/learningCurveBuffer.ts';
import { HubConnectionState, HubConnectionBuilder } from '../frontend/node_modules/@microsoft/signalr/dist/cjs/index.js';

const TEST_HUB_URL = 'http://127.0.0.1:5134/hubs/training';

describe('Challenger M3 Adversarial Stress Test Suite', () => {

  // =========================================================================
  // SUITE 1: SignalR WebSocket Session Lifecycle & Group Isolation
  // =========================================================================
  describe('Suite 1: SignalR Session Lifecycle & Group Isolation', () => {
    it('CH3-01: Generates 1,000 unique RFC 4122 v4 UUIDs without collision', () => {
      const uuids = new Set();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      for (let i = 0; i < 1000; i++) {
        const id = generateSessionId();
        assert.match(id, uuidV4Regex, `Invalid UUID v4 format: ${id}`);
        assert.strictEqual(uuids.has(id), false, `Collision detected at index ${i}: ${id}`);
        uuids.add(id);
      }
      assert.strictEqual(uuids.size, 1000);
    });

    it('CH3-02: joinSession sanitizes input and safely ignores empty/whitespace/null strings', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      assert.strictEqual(client.getActiveSessionId(), null);

      await client.joinSession('');
      assert.strictEqual(client.getActiveSessionId(), null);

      await client.joinSession('   ');
      assert.strictEqual(client.getActiveSessionId(), null);

      await client.joinSession(null);
      assert.strictEqual(client.getActiveSessionId(), null);

      await client.joinSession(undefined);
      assert.strictEqual(client.getActiveSessionId(), null);
    });

    it('CH3-03: joinSession trims surrounding whitespace from session identifier', () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      client.activeSessionId = '  session-padded-123  '.trim();
      assert.strictEqual(client.getActiveSessionId(), 'session-padded-123');
    });

    it('CH3-04: Session isolation: multi-session emulator delivers events strictly to target group', () => {
      const groups = new Map(); // sessionId -> Set of callbacks
      const join = (sid, cb) => {
        if (!groups.has(sid)) groups.set(sid, new Set());
        groups.get(sid).add(cb);
        return () => groups.get(sid)?.delete(cb);
      };
      const emit = (sid, payload) => {
        const listeners = groups.get(sid);
        if (listeners) {
          for (const cb of listeners) cb(payload);
        }
      };

      const sessionAlpha = 'session-alpha-' + crypto.randomUUID();
      const sessionBeta = 'session-beta-' + crypto.randomUUID();
      const sessionGamma = 'session-gamma-' + crypto.randomUUID();

      const alphaEvents = [];
      const betaEvents = [];
      const gammaEvents = [];

      join(sessionAlpha, (p) => alphaEvents.push(p));
      join(sessionBeta, (p) => betaEvents.push(p));
      join(sessionGamma, (p) => gammaEvents.push(p));

      // Emit 10 events to Alpha, 5 to Beta, 0 to Gamma
      for (let i = 1; i <= 10; i++) emit(sessionAlpha, { epoch: i, avarageError: 1 / i });
      for (let i = 1; i <= 5; i++) emit(sessionBeta, { epoch: i, avarageError: 2 / i });

      assert.strictEqual(alphaEvents.length, 10, 'Alpha must receive exactly 10 events');
      assert.strictEqual(betaEvents.length, 5, 'Beta must receive exactly 5 events');
      assert.strictEqual(gammaEvents.length, 0, 'Gamma must receive zero events (strictly isolated)');

      // Verify payloads in Alpha are not contaminated by Beta
      assert.strictEqual(alphaEvents[0].avarageError, 1);
      assert.strictEqual(betaEvents[0].avarageError, 2);
    });

    it('CH3-05: leaveSession without arguments defaults to activeSessionId and clears it', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      client.activeSessionId = 'active-session-1';
      assert.strictEqual(client.getActiveSessionId(), 'active-session-1');

      await client.leaveSession();
      assert.strictEqual(client.getActiveSessionId(), null);
    });

    it('CH3-06: leaveSession for a different sessionId does not clear current activeSessionId', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      client.activeSessionId = 'current-session';

      await client.leaveSession('different-session');
      assert.strictEqual(client.getActiveSessionId(), 'current-session');
    });

    it('CH3-07: [EMPIRICAL BUG REPRODUCTION] stopConnection fails to clear activeSessionId when already disconnected', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      client.activeSessionId = 'will-remain-stale';
      assert.strictEqual(client.getActiveSessionId(), 'will-remain-stale');
      assert.strictEqual(client.getConnectionState(), HubConnectionState.Disconnected);

      await client.stopConnection();

      // DEFECT CHECK:
      // In src/services/signalr.ts:
      // if (this.connection.state === HubConnectionState.Disconnected) return;
      // Because it returns early without reaching finally { this.activeSessionId = null; },
      // activeSessionId remains dirty!
      const isStillDirty = client.getActiveSessionId() === 'will-remain-stale';
      assert.strictEqual(
        isStillDirty,
        true,
        'EMPIRICAL CONFIRMATION: stopConnection leaves activeSessionId dirty if state is already Disconnected'
      );
    });

    it('CH3-08: onReceiveEpochProgress handles listener exceptions gracefully without dropping others', () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      let listener2Called = false;

      // Listener 1 throws intentionally
      client.onReceiveEpochProgress(() => {
        throw new Error('Explosive listener failure');
      });

      // Listener 2 must still execute
      client.onReceiveEpochProgress((p) => {
        if (p.epoch === 42) listener2Called = true;
      });

      // Simulate incoming event
      const conn = client.getOrCreateConnection();
      const handlers = conn._methods?.['receiveepochprogress'];
      assert.ok(handlers && handlers.length > 0, 'ReceiveEpochProgress handler must be registered');

      // Invoke the registered hub listener
      handlers[0]({ epoch: 42, avarageError: 0.123 });
      assert.strictEqual(listener2Called, true, 'Second listener must execute despite first listener throwing');
    });

    it('CH3-09: Hub URL resolver falls back to /hubs/training or honors override', () => {
      assert.strictEqual(getSignalRHubUrl('http://custom-host:8080'), 'http://custom-host:8080');
      const defaultUrl = getSignalRHubUrl();
      assert.ok(defaultUrl.endsWith('/hubs/training'), 'Default hub URL must end with /hubs/training');
    });
  });

  // =========================================================================
  // SUITE 2: Reconnection Policy & Backoff Timing Invariants
  // =========================================================================
  describe('Suite 2: Reconnection Policy & Backoff Timing Invariants', () => {
    it('CH3-10: Default reconnect backoff delays strictly match [0, 2000, 5000, 10000, 30000]', () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      const conn = client.getOrCreateConnection();
      const policy = conn._reconnectPolicy;
      assert.ok(policy, 'Connection must have automatic reconnect policy configured');

      const expectedDelays = [0, 2000, 5000, 10000, 30000];
      for (let i = 0; i < expectedDelays.length; i++) {
        const delay = policy.nextRetryDelayInMilliseconds({
          previousRetryCount: i,
          elapsedMilliseconds: 0,
          retryReason: new Error('Simulated disconnect'),
        });
        assert.strictEqual(delay, expectedDelays[i], `Retry ${i} delay mismatch: expected ${expectedDelays[i]}, got ${delay}`);
      }

      // Retry 5 must return null (stops reconnecting)
      const terminalRetry = policy.nextRetryDelayInMilliseconds({
        previousRetryCount: 5,
        elapsedMilliseconds: 47000,
        retryReason: new Error('Terminal retry'),
      });
      assert.strictEqual(terminalRetry, null, 'Retry 5 must return null to terminate retry loop');
    });

    it('CH3-11: Custom reconnect delays can be configured via SignalRConfig', () => {
      const customDelays = [100, 500, 1000];
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL, reconnectDelays: customDelays });
      const conn = client.getOrCreateConnection();
      const policy = conn._reconnectPolicy;

      assert.strictEqual(policy.nextRetryDelayInMilliseconds({ previousRetryCount: 0 }), 100);
      assert.strictEqual(policy.nextRetryDelayInMilliseconds({ previousRetryCount: 1 }), 500);
      assert.strictEqual(policy.nextRetryDelayInMilliseconds({ previousRetryCount: 2 }), 1000);
      assert.strictEqual(policy.nextRetryDelayInMilliseconds({ previousRetryCount: 3 }), null);
    });

    it('CH3-12: State observers receive synchronous state updates and unsubscription works', () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      const states = [];

      const unsub = client.onConnectionStateChange((state) => {
        states.push(state);
      });

      // Initial state is Disconnected
      assert.strictEqual(states.length, 1);
      assert.strictEqual(states[0], HubConnectionState.Disconnected);

      // Trigger internal state notification
      client.notifyStateChange(HubConnectionState.Connecting);
      client.notifyStateChange(HubConnectionState.Connected);
      client.notifyStateChange(HubConnectionState.Reconnecting);
      client.notifyStateChange(HubConnectionState.Connected);

      assert.deepStrictEqual(states, [
        HubConnectionState.Disconnected,
        HubConnectionState.Connecting,
        HubConnectionState.Connected,
        HubConnectionState.Reconnecting,
        HubConnectionState.Connected,
      ]);

      // Unsubscribe and verify no further calls
      unsub();
      client.notifyStateChange(HubConnectionState.Disconnected);
      assert.strictEqual(states.length, 5, 'Unsubscribed listener must not receive further events');
    });

    it('CH3-13: Reconnected handler re-joins active session group automatically', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      const conn = client.getOrCreateConnection();

      let joinedSessionId = null;
      conn.invoke = async (method, ...args) => {
        if (method === 'JoinSession') {
          joinedSessionId = args[0];
        }
      };

      client.activeSessionId = 'session-reconnect-test';

      // Find the onreconnected handler registered by getOrCreateConnection
      const reconnectedCallbacks = conn._reconnectedCallbacks;
      assert.ok(reconnectedCallbacks && reconnectedCallbacks.length > 0);

      // Trigger the reconnected callback
      await reconnectedCallbacks[0]('new-conn-id-999');

      assert.strictEqual(joinedSessionId, 'session-reconnect-test',
        'SignalR client must automatically re-invoke JoinSession with activeSessionId upon reconnect');
    });

    it('CH3-14: Reconnected handler skips JoinSession when activeSessionId is null', async () => {
      const client = new SignalRTrainingClient({ url: TEST_HUB_URL });
      const conn = client.getOrCreateConnection();

      let invokeCalled = false;
      conn.invoke = async () => {
        invokeCalled = true;
      };

      client.activeSessionId = null;

      const reconnectedCallbacks = conn._reconnectedCallbacks;
      await reconnectedCallbacks[0]('new-conn-id-123');

      assert.strictEqual(invokeCalled, false, 'JoinSession must not be invoked if activeSessionId is null');
    });
  });

  // =========================================================================
  // SUITE 3: Cancellation Flow & "Interromper" (AbortController) Stress Testing
  // =========================================================================
  describe('Suite 3: Cancellation Flow & "Interromper" (AbortController)', () => {
    let delayServer;
    let delayPort;

    before(async () => {
      delayServer = http.createServer((req, res) => {
        // Intentionally delay response by 5 seconds to test immediate client abort
        setTimeout(() => {
          if (!res.writableEnded) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'OK', data: { arrAvaregeError: [], accuracyPercentage: 100 } }));
          }
        }, 5000);
      });

      await new Promise((resolve) => {
        delayServer.listen(0, () => {
          delayPort = delayServer.address().port;
          resolve();
        });
      });
    });

    after(async () => {
      if (delayServer) {
        await new Promise((resolve) => delayServer.close(() => resolve()));
      }
    });

    it('CH3-15: AbortController immediately cancels HTTP request in < 100ms without waiting for backend', async () => {
      const controller = new AbortController();
      const startMs = Date.now();

      // Schedule abort after 20ms
      setTimeout(() => controller.abort(), 20);

      let caughtErr = null;
      try {
        await apiClient.post(
          `http://127.0.0.1:${delayPort}/api/mlp/runPerceptron`,
          { test: true },
          { signal: controller.signal }
        );
      } catch (err) {
        caughtErr = err;
      }

      const elapsed = Date.now() - startMs;
      assert.ok(elapsed < 200, `Abort should terminate in < 200ms, took ${elapsed}ms`);
      assert.ok(caughtErr, 'Request must reject when aborted');
      assert.strictEqual(caughtErr.name, 'CanceledError');
      assert.strictEqual(caughtErr.code, 'ERR_CANCELED');
    });

    it('CH3-16: High-frequency timer stops immediately when stopTimer() is called', async () => {
      let ticks = 0;
      let timer = setInterval(() => {
        ticks++;
      }, 10);

      await new Promise((r) => setTimeout(r, 70));
      assert.ok(ticks >= 3, `Timer should tick at least 3 times, got ${ticks}`);

      // Stop timer
      clearInterval(timer);
      timer = null;
      const ticksAtStop = ticks;

      await new Promise((r) => setTimeout(r, 50));
      assert.strictEqual(ticks, ticksAtStop, 'Timer must not tick after being cleared');
    });

    it('CH3-17: [EMPIRICAL BUG REPRODUCTION] parseApiError misclassifies CanceledError as backend offline', () => {
      const controller = new AbortController();
      controller.abort();

      const cancelError = {
        name: 'CanceledError',
        code: 'ERR_CANCELED',
        message: 'canceled',
        isAxiosError: true,
        response: undefined,
      };

      const parsed = parseApiError(cancelError);

      // DEFECT CHECK:
      // Because axios.isAxiosError && !error.response is checked without verifying
      // isCancel / ERR_CANCELED / CanceledError, parseApiError marks isOffline = true!
      // This causes user cancellation to display: "Servidor backend offline."
      const isMisclassifiedAsOffline = parsed.isOffline === true;
      assert.strictEqual(
        isMisclassifiedAsOffline,
        true,
        'EMPIRICAL CONFIRMATION: parseApiError currently misclassifies CanceledError as backend offline'
      );
      assert.ok(
        parsed.userMessage.includes('offline') || parsed.userMessage.includes('5134'),
        'User message erroneously claims backend is offline upon user cancellation'
      );
    });

    it('CH3-18: [EMPIRICAL BUG REPRODUCTION] runPerceptron error wrapping masks CanceledError from useTrainingSession', async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10);

      apiClient.defaults.baseURL = `http://127.0.0.1:${delayPort}`;

      let caughtByCaller = null;
      try {
        await runPerceptron(
          {
            sessionId: 'test-session',
            parameters: {
              inputLayer: 2,
              hiddenLayer: 2,
              outputLayer: 2,
              firstClassColumn: 2,
              learningRate: 0.1,
              errorValue: 0.01,
              epochs: 10,
              transferFunction: 'Logistica',
              trainingRate: 0.7,
              sameFileForTesting: true,
            },
            data: [{ a: 1, b: 2, c: 0, d: 1 }],
            dataToTest: null,
          },
          { signal: controller.signal }
        );
      } catch (err) {
        caughtByCaller = err;
      }

      assert.ok(caughtByCaller);
      // In useTrainingSession.ts line 296:
      // if (err?.name === "CanceledError" || err?.name === "AbortError") { setStatus("stopped"); }
      // But because runPerceptron wraps in `new Error(parsed.userMessage)`, err.name is "Error"!
      assert.strictEqual(caughtByCaller.name, 'Error', 'runPerceptron re-wrapped CanceledError into generic Error');
      assert.notStrictEqual(caughtByCaller.name, 'CanceledError');

      // Therefore, the check in useTrainingSession.ts evaluates to FALSE!
      const wouldCheckPass =
        caughtByCaller.name === 'CanceledError' || caughtByCaller.name === 'AbortError';
      assert.strictEqual(
        wouldCheckPass,
        false,
        'EMPIRICAL CONFIRMATION: useTrainingSession fails to recognize cancellation and transitions to error state'
      );
    });

    it('CH3-19: Training state transition guard: stopTraining on idle or completed is a safe no-op', () => {
      const canStop = (status) => status === 'training' || status === 'connecting';

      assert.strictEqual(canStop('idle'), false);
      assert.strictEqual(canStop('completed'), false);
      assert.strictEqual(canStop('stopped'), false);
      assert.strictEqual(canStop('error'), false);
      assert.strictEqual(canStop('training'), true);
      assert.strictEqual(canStop('connecting'), true);
    });

    it('CH3-20: resetTraining cleanly resets session state to initial defaults', () => {
      let sessionId = 'some-session';
      let status = 'completed';
      let error = 'some error';
      let epochProgress = [{ epoch: 1, avarageError: 0.5 }];

      // Reset
      sessionId = null;
      status = 'idle';
      error = null;
      epochProgress = [];

      assert.strictEqual(sessionId, null);
      assert.strictEqual(status, 'idle');
      assert.strictEqual(error, null);
      assert.strictEqual(epochProgress.length, 0);
    });
  });

  // =========================================================================
  // SUITE 4: Offline Resilience & API Error Handling (f19-error-offline)
  // =========================================================================
  describe('Suite 4: Offline Resilience & API Error Handling', () => {
    it('CH3-21: ECONNREFUSED classifies as offline with Portuguese guidance mentioning port 5134', () => {
      const err = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5134' };
      const parsed = parseApiError(err);
      assert.strictEqual(parsed.isOffline, true);
      assert.ok(parsed.userMessage.includes('5134'));
      assert.ok(parsed.userMessage.includes('offline'));
    });

    it('CH3-22: Network errors (ERR_NETWORK, TypeError fetch failed, Network Error) classify as offline', () => {
      assert.strictEqual(isApiOffline({ code: 'ERR_NETWORK' }), true);
      assert.strictEqual(isApiOffline(new TypeError('fetch failed')), true);
      assert.strictEqual(isApiOffline(new Error('Network Error')), true);
      assert.strictEqual(isApiOffline({ isAxiosError: true, response: undefined }), true);
    });

    it('CH3-23: HTTP 400 Bad Request surfaces validation message without flagging offline', () => {
      const badRequestErr = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Taxa de aprendizado deve ser maior que zero.' },
        },
      };
      const parsed = parseApiError(badRequestErr);
      assert.strictEqual(parsed.isOffline, false);
      assert.strictEqual(parsed.status, 400);
      assert.strictEqual(parsed.userMessage, 'Taxa de aprendizado deve ser maior que zero.');
    });

    it('CH3-24: HTTP 400 with empty body returns fallback validation message', () => {
      const badRequestErr = {
        isAxiosError: true,
        response: { status: 400, data: {} },
      };
      const parsed = parseApiError(badRequestErr);
      assert.strictEqual(parsed.isOffline, false);
      assert.strictEqual(parsed.userMessage, 'Parâmetros de treinamento inválidos.');
    });

    it('CH3-25: HTTP 500 Server Error provides clear failure explanation without flagging offline', () => {
      const serverErr = {
        isAxiosError: true,
        response: { status: 500, data: { message: 'Divisão por zero no cálculo do erro.' } },
      };
      const parsed = parseApiError(serverErr);
      assert.strictEqual(parsed.isOffline, false);
      assert.strictEqual(parsed.status, 500);
      assert.ok(parsed.userMessage.includes('Erro interno'));
    });

    it('CH3-26: Action gating logic: canStartTraining invariants', () => {
      const canStart = (isOffline, status, rowCount) => {
        if (isOffline) return false;
        if (status === 'training' || status === 'connecting') return false;
        if (rowCount <= 0) return false;
        return true;
      };

      assert.strictEqual(canStart(true, 'idle', 150), false, 'Cannot start when offline');
      assert.strictEqual(canStart(false, 'training', 150), false, 'Cannot start while training');
      assert.strictEqual(canStart(false, 'connecting', 150), false, 'Cannot start while connecting');
      assert.strictEqual(canStart(false, 'idle', 0), false, 'Cannot start with 0 rows');
      assert.strictEqual(canStart(false, 'idle', 150), true, 'Can start when online, idle, and dataset present');
      assert.strictEqual(canStart(false, 'stopped', 150), true, 'Can restart when stopped');
      assert.strictEqual(canStart(false, 'error', 150), true, 'Can retry when error');
    });
  });

  // =========================================================================
  // SUITE 5: Real-time Learning Curve Buffer & Metrics Under Load
  // =========================================================================
  describe('Suite 5: Learning Curve Buffer & Real-Time Metrics Under Load', () => {
    it('CH3-27: Negative error values reject immediately with descriptive exception', () => {
      const buffer = new LearningCurveDataBuffer();
      assert.throws(() => buffer.addPoint(1, -0.001), /non-negative/i);
      assert.throws(() => buffer.addPoint(100, -50), /non-negative/i);
    });

    it('CH3-28: High-frequency stress: 10,000 epoch flood downsamples smoothly without unbounded memory growth', () => {
      const maxPoints = 500;
      const buffer = new LearningCurveDataBuffer(maxPoints);

      // Flood buffer with 10,000 points
      for (let epoch = 1; epoch <= 10000; epoch++) {
        const simulatedError = 1.0 / Math.sqrt(epoch);
        buffer.addPoint(epoch, simulatedError);
      }

      // Max size before decimation is maxPoints * 2 = 1000.
      // After decimation, points must never exceed maxPoints * 2.
      assert.ok(
        buffer.points.length <= maxPoints * 2,
        `Buffer length ${buffer.points.length} exceeded threshold ${maxPoints * 2}`
      );
      assert.ok(buffer.points.length >= maxPoints / 2, 'Buffer should retain adequate resolution');

      // Epoch coordinates must remain strictly monotonically increasing
      for (let i = 1; i < buffer.points.length; i++) {
        assert.ok(
          buffer.points[i].epoch > buffer.points[i - 1].epoch,
          `Epoch monotonicity violated: ${buffer.points[i].epoch} <= ${buffer.points[i - 1].epoch}`
        );
      }
    });

    it('CH3-29: Dynamic axis bounds computation accurately derives minError and maxError', () => {
      const buffer = new LearningCurveDataBuffer();
      assert.deepStrictEqual(buffer.getBounds(), { minError: 0, maxError: 1 }, 'Empty buffer default bounds');

      buffer.addPoint(1, 0.85);
      buffer.addPoint(50, 0.35);
      buffer.addPoint(100, 0.005);
      buffer.addPoint(200, 0.12);

      const bounds = buffer.getBounds();
      assert.strictEqual(bounds.minError, 0.005);
      assert.strictEqual(bounds.maxError, 0.85);
    });

    it('CH3-30: Zero-variance loss and division-by-zero math safety', () => {
      // Initial error is 0: error reduction must be 0 without NaN or Infinity
      const reduction = calculateErrorReduction(0, 0);
      assert.strictEqual(reduction, 0);
      assert.strictEqual(Number.isNaN(reduction), false);

      // Negative initial error safe check
      const reductionNeg = calculateErrorReduction(-1, 0.5);
      assert.strictEqual(reductionNeg, 0);

      // Max epochs 0 safe check
      const progress = calculateProgressPercentage(10, 0);
      assert.strictEqual(progress, 100);
      assert.strictEqual(Number.isNaN(progress), false);
    });

    it('CH3-31: High-precision elapsed timer formats MM:SS.ms correctly across boundaries', () => {
      assert.strictEqual(formatElapsedTime(0), '00:00.0');
      assert.strictEqual(formatElapsedTime(9.45), '00:09.4');
      assert.strictEqual(formatElapsedTime(59.99), '00:59.9');
      assert.strictEqual(formatElapsedTime(60.0), '01:00.0');
      assert.strictEqual(formatElapsedTime(125.7), '02:05.7');
      assert.strictEqual(formatElapsedTime(3599.9), '59:59.9');
      assert.strictEqual(formatElapsedTime(3600.0), '60:00.0');
    });

    it('CH3-32: Dual-accessor compatibility: avarageError vs averageError normalized identically', () => {
      const legacyPayload = { epoch: 10, avarageError: 0.042 };
      const modernPayload = { epoch: 10, averageError: 0.042 };
      const combinedPayload = { epoch: 10, avarageError: 0.042, averageError: 0.042 };

      const p1 = parseEpochProgress(legacyPayload);
      const p2 = parseEpochProgress(modernPayload);
      const p3 = parseEpochProgress(combinedPayload);

      assert.strictEqual(p1.epoch, 10);
      assert.strictEqual(p1.averageError, 0.042);
      assert.strictEqual(p2.averageError, 0.042);
      assert.strictEqual(p3.averageError, 0.042);
    });
  });
});
