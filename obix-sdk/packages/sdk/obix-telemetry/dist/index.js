/**
 * OBIX Telemetry - State tracking, policy decorators, QA matrix integration
 * Comprehensive event instrumentation and quality metrics collection
 */
const randomId = () => Math.random().toString(36).slice(2);
export function createTelemetry(config) {
    const events = [];
    const decorators = [...(config.decorators ?? [])];
    const emitEnvironmentEvent = (eventType, payload) => {
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
        track(event) {
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
        query(filter) {
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
        getQAMatrix() {
            return {
                truePositive: events.filter((event) => event.severity === "error").length,
                trueNegative: events.filter((event) => event.severity === "debug").length,
                falsePositive: events.filter((event) => event.severity === "warn").length,
                falseNegative: events.filter((event) => event.severity === "info").length
            };
        },
        createPolicyDecorator(decorator) {
            decorators.push(decorator);
        }
    };
}
//# sourceMappingURL=index.js.map