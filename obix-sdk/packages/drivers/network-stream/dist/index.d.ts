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
export declare function createNetworkStreamDriver(config: NetworkStreamDriverConfig): NetworkStreamDriverAPI;
//# sourceMappingURL=index.d.ts.map