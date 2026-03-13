import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTelemetry } from '../src/index.js';

const createEventTargetStub = () => {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    addEventListener: (type: string, handler: () => void) => {
      listeners[type] = [...(listeners[type] ?? []), handler];
    },
    dispatch: (type: string) => (listeners[type] ?? []).forEach((handler) => handler())
  };
};

describe('obix-telemetry integration', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits stale-tab and offline detection events', () => {
    const windowStub = createEventTargetStub();
    const documentStub = {
      ...createEventTargetStub(),
      hidden: true
    };

    vi.stubGlobal('window', windowStub);
    vi.stubGlobal('document', documentStub);

    const telemetry = createTelemetry({ enabled: true });

    windowStub.dispatch('offline');
    documentStub.dispatch('visibilitychange');

    expect(telemetry.query({ eventType: 'network.offline' })).toHaveLength(1);
    expect(telemetry.query({ eventType: 'tab.stale' })).toHaveLength(1);
  });
});
