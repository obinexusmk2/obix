/**
 * OBIX Telemetry - State tracking, policy decorators, QA matrix integration
 * Comprehensive event instrumentation and quality metrics collection
 */
/**
 * QA Matrix - Confusion matrix for quality metrics
 */
export interface QAMatrix {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
}
/**
 * Telemetry event data structure
 */
export interface TelemetryEvent {
    id: string;
    timestamp: number;
    eventType: string;
    payload: Record<string, unknown>;
    severity: "debug" | "info" | "warn" | "error";
    context?: Record<string, unknown>;
}
/**
 * Policy decorator for telemetry
 */
export interface PolicyDecorator {
    name: string;
    condition: (event: TelemetryEvent) => boolean;
    transform?: (event: TelemetryEvent) => TelemetryEvent;
    sampleRate?: number;
}
/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
    enabled: boolean;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    decorators?: PolicyDecorator[];
}
/**
 * Telemetry engine interface
 */
export interface TelemetryEngine {
    track(event: TelemetryEvent): void;
    query(filter: {
        eventType?: string;
        severity?: string;
    }): TelemetryEvent[];
    getQAMatrix(): QAMatrix;
    createPolicyDecorator(decorator: PolicyDecorator): void;
}
/**
 * Create a telemetry engine instance
 */
export declare function createTelemetry(config: TelemetryConfig): TelemetryEngine;
//# sourceMappingURL=index.d.ts.map