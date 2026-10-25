/**
 * SignalR WebSocket Client Service
 *
 * Provides real-time bidirectional communication with ASP.NET Core TrainingHub (/hubs/training).
 * Features:
 * - Automatic reconnection with exponential backoff [0, 2000, 5000, 10000, 30000].
 * - Automatic session group re-joining on reconnect.
 * - Connection lifecycle & state observer subscriptions.
 * - Live ReceiveEpochProgress streaming with data normalization (avarageError & averageError).
 * - Concurrency-safe start/stop methods with in-flight deduplication.
 */

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { EpochProgress } from "../types/mlp";

export type ConnectionStateChangeCallback = (state: HubConnectionState) => void;
export type EpochProgressCallback = (data: EpochProgress) => void;

export interface SignalRConfig {
  url?: string;
  reconnectDelays?: number[];
  logLevel?: LogLevel;
}

/**
 * Resolves the SignalR hub URL based on environment or relative proxy.
 * Fallback connects to /hubs/training (proxied to http://localhost:5134 in dev).
 */
export function getSignalRHubUrl(overrideUrl?: string): string {
  if (overrideUrl) return overrideUrl;
  const metaEnv = (import.meta as any).env;
  const envUrl = metaEnv?.VITE_BACKEND_URL || metaEnv?.VITE_API_URL;

  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return `${trimmed}/hubs/training`;
  }
  return "/hubs/training";
}

/**
 * Generates a valid unique RFC 4122 UUID v4 for training session isolation.
 */
export function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Manages an individual SignalR hub connection instance.
 */
export class SignalRTrainingClient {
  private connection: HubConnection | null = null;
  private activeSessionId: string | null = null;
  private stateListeners: Set<ConnectionStateChangeCallback> = new Set();
  private progressListeners: Set<EpochProgressCallback> = new Set();
  private startPromise: Promise<void> | null = null;
  private readonly config: SignalRConfig;

  constructor(config: SignalRConfig = {}) {
    this.config = config;
  }

  /**
   * Initializes or returns the existing HubConnection instance.
   */
  public getOrCreateConnection(): HubConnection {
    if (this.connection) {
      return this.connection;
    }

    const hubUrl = getSignalRHubUrl(this.config.url);
    const reconnectDelays =
      this.config.reconnectDelays ?? [0, 2000, 5000, 10000, 30000];
    const metaEnv = (import.meta as any).env;
    const logLevel =
      this.config.logLevel ??
      (metaEnv?.DEV ? LogLevel.Information : LogLevel.Warning);

    const builder = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
      })
      .withAutomaticReconnect(reconnectDelays)
      .configureLogging(logLevel);

    const conn = builder.build();

    // Event listener for backend ReceiveEpochProgress emissions
    conn.on(
      "ReceiveEpochProgress",
      (rawPayload: { epoch: number; avarageError?: number; averageError?: number }) => {
        const err = rawPayload.avarageError ?? rawPayload.averageError ?? 0;
        const normalized: EpochProgress = {
          epoch: rawPayload.epoch,
          avarageError: err,
          averageError: err,
        };

        this.progressListeners.forEach((callback) => {
          try {
            callback(normalized);
          } catch (listenerErr) {
            console.error("[SignalR] Error in epoch progress listener:", listenerErr);
          }
        });
      }
    );

    // Reconnecting lifecycle event
    conn.onreconnecting((error) => {
      console.warn("[SignalR] Connection lost. Attempting reconnect...", error);
      this.notifyStateChange(HubConnectionState.Reconnecting);
    });

    // Reconnected lifecycle event: re-join active session group automatically
    conn.onreconnected(async (newConnectionId) => {
      console.info(`[SignalR] Reconnected successfully. New connection ID: ${newConnectionId}`);
      this.notifyStateChange(HubConnectionState.Connected);

      if (this.activeSessionId) {
        try {
          await conn.invoke("JoinSession", this.activeSessionId);
          console.info(`[SignalR] Re-joined session group: ${this.activeSessionId}`);
        } catch (err) {
          console.error(
            `[SignalR] Failed to re-join session group ${this.activeSessionId}:`,
            err
          );
        }
      }
    });

    // Closed lifecycle event
    conn.onclose((error) => {
      console.warn("[SignalR] Connection closed.", error);
      this.notifyStateChange(HubConnectionState.Disconnected);
    });

    this.connection = conn;
    return conn;
  }

  /**
   * Starts the connection if not already connected.
   * Safe against concurrent calls with in-flight deduplication.
   */
  public async startConnection(): Promise<void> {
    const conn = this.getOrCreateConnection();

    if (conn.state === HubConnectionState.Connected) {
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = (async () => {
      this.notifyStateChange(HubConnectionState.Connecting);
      try {
        await conn.start();
        this.notifyStateChange(HubConnectionState.Connected);
        console.info(`[SignalR] Connected to TrainingHub at ${conn.baseUrl}`);
      } catch (err) {
        this.notifyStateChange(conn.state);
        console.error("[SignalR] Connection start failed:", err);
        throw err;
      } finally {
        this.startPromise = null;
      }
    })();

    return this.startPromise;
  }

  /**
   * Gracefully stops the connection and resets active state.
   */
  public async stopConnection(): Promise<void> {
    if (!this.connection) return;
    if (this.connection.state === HubConnectionState.Disconnected) return;

    this.notifyStateChange(HubConnectionState.Disconnecting);
    try {
      await this.connection.stop();
    } finally {
      this.activeSessionId = null;
      this.notifyStateChange(HubConnectionState.Disconnected);
    }
  }

  /**
   * Joins a specific session group to receive isolated training updates.
   */
  public async joinSession(sessionId: string): Promise<void> {
    if (!sessionId || !sessionId.trim()) return;
    const cleanId = sessionId.trim();
    this.activeSessionId = cleanId;

    const conn = this.getOrCreateConnection();
    if (conn.state !== HubConnectionState.Connected) {
      await this.startConnection();
    }

    await conn.invoke("JoinSession", cleanId);
    console.info(`[SignalR] Successfully joined session: ${cleanId}`);
  }

  /**
   * Leaves a session group when training ends.
   */
  public async leaveSession(sessionId?: string): Promise<void> {
    const targetId = sessionId?.trim() || this.activeSessionId;
    if (!targetId) return;

    if (this.activeSessionId === targetId) {
      this.activeSessionId = null;
    }

    const conn = this.getOrCreateConnection();
    if (conn.state === HubConnectionState.Connected) {
      try {
        await conn.invoke("LeaveSession", targetId);
        console.info(`[SignalR] Left session: ${targetId}`);
      } catch (err) {
        console.warn(`[SignalR] Failed to leave session ${targetId}:`, err);
      }
    }
  }

  /**
   * Registers a callback for real-time epoch progress updates.
   * Returns an unsubscribe function.
   */
  public onReceiveEpochProgress(callback: EpochProgressCallback): () => void {
    this.progressListeners.add(callback);
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Registers a callback for connection state changes.
   * Immediately invokes the callback with current state.
   * Returns an unsubscribe function.
   */
  public onConnectionStateChange(callback: ConnectionStateChangeCallback): () => void {
    this.stateListeners.add(callback);
    try {
      callback(this.getConnectionState());
    } catch (err) {
      console.error("[SignalR] Error in state listener callback:", err);
    }

    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Returns current hub connection state.
   */
  public getConnectionState(): HubConnectionState {
    return this.connection ? this.connection.state : HubConnectionState.Disconnected;
  }

  /**
   * Returns true if connection is currently active and ready.
   */
  public isConnected(): boolean {
    return this.getConnectionState() === HubConnectionState.Connected;
  }

  /**
   * Returns current active session ID if any.
   */
  public getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  private notifyStateChange(state: HubConnectionState): void {
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("[SignalR] Error in state change listener callback:", err);
      }
    });
  }
}

// Global singleton instance for application-wide use
export const signalRService = new SignalRTrainingClient();

// Convenience functional exports matching interface contract
export const startConnection = () => signalRService.startConnection();
export const stopConnection = () => signalRService.stopConnection();
export const joinSession = (sessionId: string) => signalRService.joinSession(sessionId);
export const leaveSession = (sessionId?: string) => signalRService.leaveSession(sessionId);
export const onReceiveEpochProgress = (cb: EpochProgressCallback) =>
  signalRService.onReceiveEpochProgress(cb);
export const onConnectionStateChange = (cb: ConnectionStateChangeCallback) =>
  signalRService.onConnectionStateChange(cb);
export const getConnectionState = () => signalRService.getConnectionState();
export const isConnected = () => signalRService.isConnected();
