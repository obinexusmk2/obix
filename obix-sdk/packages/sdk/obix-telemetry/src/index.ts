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
  query(filter: { eventType?: string; severity?: string }): TelemetryEvent[];
  getQAMatrix(): QAMatrix;
  createPolicyDecorator(decorator: PolicyDecorator): void;
}

const randomId = (): string => Math.random().toString(36).slice(2);

export function createTelemetry(config: TelemetryConfig): TelemetryEngine {
  const events: TelemetryEvent[] = [];
  const decorators = [...(config.decorators ?? [])];

  const emitEnvironmentEvent = (eventType: string, payload: Record<string, unknown>): void => {
    events.push({
      id: randomId(),
      timestamp: Date.now(),
      eventType,
      payload,
      severity: "info"
    });
  };

  if (config.enabled && typeof window !== "undefined") {
    window.addEventListener("offline", () => emitEnvironmentEvent("network.offline", { online: false }));
    window.addEventListener("online", () => emitEnvironmentEvent("network.online", { online: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        emitEnvironmentEvent("tab.stale", { hidden: true });
      }
    });
  }

  return {
    track(event: TelemetryEvent): void {
      if (!config.enabled) {
        return;
      }

      let candidate = event;
      for (const decorator of decorators) {
        if (!decorator.condition(candidate)) {
          continue;
        }

        if (decorator.sampleRate !== undefined && Math.random() > decorator.sampleRate) {
          return;
        }

        candidate = decorator.transform?.(candidate) ?? candidate;
      }

      events.push(candidate);
    },
    query(filter: { eventType?: string; severity?: string }): TelemetryEvent[] {
      return events.filter((event) => {
        if (filter.eventType && event.eventType !== filter.eventType) {
          return false;
        }

        if (filter.severity && event.severity !== filter.severity) {
          return false;
        }

        return true;
      });
    },
    getQAMatrix(): QAMatrix {
      return {
        truePositive: events.filter((event) => event.severity === "error").length,
        trueNegative: events.filter((event) => event.severity === "debug").length,
        falsePositive: events.filter((event) => event.severity === "warn").length,
        falseNegative: events.filter((event) => event.severity === "info").length
      };
    },
    createPolicyDecorator(decorator: PolicyDecorator): void {
      decorators.push(decorator);
    }
  };
}
