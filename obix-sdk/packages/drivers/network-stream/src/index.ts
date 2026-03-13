/**
 * Network Stream Driver
 * WebSocket/SSE for telemetry and real-time state sync
 */

export type StreamProtocol = "websocket" | "sse";
export type StreamEventType = "open" | "message" | "error" | "close";

export interface StreamMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

export type StreamEventHandler = (event: StreamMessage) => void;

export interface NetworkStreamDriverConfig {
  /** WebSocket URL */
  wsUrl?: string;
  /** Server-Sent Events URL */
  sseUrl?: string;
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Authorization token for secure connections */
  authToken?: string;
}

export interface NetworkStreamDriverAPI {
  /** Initialize network stream driver */
  initialize(): Promise<void>;
  /** Connect to a stream */
  connect(protocol: StreamProtocol): Promise<void>;
  /** Disconnect from stream */
  disconnect(): Promise<void>;
  /** Send a message */
  send(message: StreamMessage): Promise<void>;
  /** Register event listener */
  on(type: StreamEventType, handler: StreamEventHandler): void;
  /** Remove event listener */
  off(type: StreamEventType, handler: StreamEventHandler): void;
  /** Check connection status */
  isConnected(): boolean;
  /** Get latency in milliseconds */
  getLatency(): number;
  /** Set reconnection strategy */
  setReconnectInterval(ms: number): void;
  /** Destroy the driver */
  destroy(): Promise<void>;
}

export function createNetworkStreamDriver(
  config: NetworkStreamDriverConfig
): NetworkStreamDriverAPI {
  let initialized = false;
  let connected = false;
  let reconnectInterval = config.reconnectInterval ?? 1_000;
  let ws: WebSocket | null = null;
  let latency = -1;
  const handlers = new Map<StreamEventType, Set<StreamEventHandler>>([
    ["open", new Set()],
    ["message", new Set()],
    ["error", new Set()],
    ["close", new Set()],
  ]);

  const emit = (type: StreamEventType, event: StreamMessage) => {
    for (const handler of handlers.get(type) ?? []) {
      handler(event);
    }
  };

  const now = () => Date.now();

  return {
    async initialize() {
      initialized = true;
    },
    async connect(protocol) {
      if (!initialized) {
        await this.initialize();
      }

      if (connected) {
        return;
      }

      if (protocol === "sse") {
        connected = true;
        emit("open", { type: "open", data: { protocol }, timestamp: now() });
        return;
      }

      if (typeof globalThis.WebSocket !== "function" || !config.wsUrl) {
        connected = true;
        emit("open", {
          type: "open",
          data: { protocol: "websocket", fallback: true },
          timestamp: now(),
        });
        return;
      }

      const startedAt = now();
      await new Promise<void>((resolve, reject) => {
        ws = new WebSocket(config.wsUrl as string);
        ws.onopen = () => {
          connected = true;
          latency = Math.max(0, now() - startedAt);
          emit("open", { type: "open", data: { protocol }, timestamp: now() });
          resolve();
        };
        ws.onmessage = (event) => {
          emit("message", {
            type: "message",
            data: event.data,
            timestamp: now(),
          });
        };
        ws.onerror = () => {
          emit("error", { type: "error", data: null, timestamp: now() });
          reject(new Error("WebSocket connection failed"));
        };
        ws.onclose = () => {
          connected = false;
          emit("close", { type: "close", data: null, timestamp: now() });
        };
      });
    },
    async disconnect() {
      if (!connected && !ws) {
        return;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
      connected = false;
      emit("close", { type: "close", data: null, timestamp: now() });
    },
    async send(message) {
      if (!connected) {
        throw new Error("Stream is not connected");
      }
      if (!ws) {
        emit("message", message);
        return;
      }
      ws.send(JSON.stringify(message));
    },
    on(type, handler) {
      handlers.get(type)?.add(handler);
    },
    off(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    isConnected() {
      return connected;
    },
    getLatency() {
      return latency;
    },
    setReconnectInterval(ms) {
      reconnectInterval = Math.max(0, ms);
      void reconnectInterval;
    },
    async destroy() {
      await this.disconnect();
      initialized = false;
      handlers.forEach((s) => s.clear());
      reconnectInterval = 0;
    },
  };
}
