import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter } from '../src/index.js';

const createWindowStub = () => {
  const location = { pathname: '/home', hash: '' };
  const listeners: Record<string, Array<() => void>> = {};
  const history = {
    state: {},
    scrollRestoration: 'auto',
    pushState: (state: Record<string, unknown>, _title: string, url: string) => {
      history.state = state;
      const [path, hash] = url.split('#');
      location.pathname = path;
      location.hash = hash ? `#${hash}` : '';
    },
    back: vi.fn(),
    forward: vi.fn()
  };

  return {
    location,
    history,
    scrollX: 25,
    scrollY: 90,
    addEventListener: (type: string, handler: () => void) => {
      listeners[type] = [...(listeners[type] ?? []), handler];
    },
    dispatch: (type: string) => (listeners[type] ?? []).forEach((handler) => handler()),
    scrollTo: vi.fn(),
    document: {
      activeElement: { id: 'feed-anchor' },
      getElementById: vi.fn(() => ({ scrollIntoView: vi.fn() }))
    }
  };
};

describe('obix-router integration', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('serializes deep link state and restores saved scroll position on navigation', async () => {
    const windowStub = createWindowStub();
    vi.stubGlobal('window', windowStub);
    vi.stubGlobal('HTMLElement', class {});

    const router = createRouter({
      routes: [
        { path: '/home', name: 'home' },
        { path: '/feed', name: 'feed' }
      ],
      deepLink: { enabled: true },
      scrollRestoration: 'auto'
    });

    await router.navigate('/feed', { page: 3, filter: 'latest' });

    expect(router.getDeepLink()).toContain('/feed#');
    expect(windowStub.history.state).toEqual({ page: 3, filter: 'latest' });
    expect(windowStub.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
