/**
 * OBIX Telemetry - State tracking, policy decorators, QA matrix integration
 * Comprehensive event instrumentation and quality metrics collection
 */
export interface QAMatrix {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
}
export interface TelemetryEvent {
    id: string;
    timestamp: number;
    eventType: string;
    payload: Record<string, unknown>;
    severity: "debug" | "info" | "warn" | "error";
    context?: Record<string, unknown>;
}
export interface PolicyDecorator {
    name: string;
    condition: (event: TelemetryEvent) => boolean;
    transform?: (event: TelemetryEvent) => TelemetryEvent;
    sampleRate?: number;
}
export interface TelemetryConfig {
    enabled: boolean;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    decorators?: PolicyDecorator[];
}
export interface TelemetryEngine {
    track(event: TelemetryEvent): void;
    query(filter: {
        eventType?: string;
        severity?: string;
    }): TelemetryEvent[];
    getQAMatrix(): QAMatrix;
    createPolicyDecorator(decorator: PolicyDecorator): void;
}
export declare function createTelemetry(config: TelemetryConfig): TelemetryEngine;
//# sourceMappingURL=index.d.ts.map