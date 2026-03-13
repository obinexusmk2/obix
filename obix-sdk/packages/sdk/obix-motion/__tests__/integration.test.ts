import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMotionEngine } from '../src/index.js';

describe('obix-motion integration', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('enforces prefers-reduced-motion strategy with instant fallback styles', async () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true })
    });

    const styleMap = new Map<string, string>();
    const element = {
      style: {
        setProperty: (key: string, value: string) => styleMap.set(key, value),
        transitionDuration: ''
      }
    } as unknown as HTMLElement;

    const motion = createMotionEngine({
      respectPrefersReducedMotion: true,
      reducedMotionStrategy: { skipAnimations: true, skipTransitions: true, instantDuration: 1 }
    });

    await motion.animate(element, {
      name: 'fade-in',
      duration: 600,
      keyframes: [
        { offset: 0, properties: { opacity: 0 } },
        { offset: 1, properties: { opacity: 1 } }
      ]
    });

    expect(motion.respectReducedMotion()).toBe(true);
    expect(element.style.transitionDuration).toBe('1ms');
    expect(styleMap.get('opacity')).toBe('1');
  });
});
