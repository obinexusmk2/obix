/**
 * Input Event Driver
 * Unified touch/mouse/keyboard/pointer event normalization
 */

export type InputEventType =
  | "pointerdown"
  | "pointerup"
  | "pointermove"
  | "pointercancel"
  | "keydown"
  | "keyup"
  | "keypress"
  | "gesturestart"
  | "gesturechange"
  | "gestureend";

export interface NormalizedInputEvent {
  type: InputEventType;
  pointerX?: number;
  pointerY?: number;
  pointerId?: string;
  isPrimary?: boolean;
  key?: string;
  keyCode?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  timestamp: number;
  target: Element;
}

export interface InputEventDriverConfig {
  rootElement: Element;
  normalizeTouch?: boolean;
  pointerCapture?: boolean;
  gestureThreshold?: number;
}

export type InputEventHandler = (event: NormalizedInputEvent) => void;

export interface InputEventDriverAPI {
  initialize(): Promise<void>;
  on(type: InputEventType, handler: InputEventHandler): void;
  off(type: InputEventType, handler: InputEventHandler): void;
  isPointerPressed(pointerId?: string): boolean;
  getLastPointerPosition(): [number, number] | null;
  setGestureThreshold(pixels: number): void;
  destroy(): Promise<void>;
}

export function createInputEventDriver(
  config: InputEventDriverConfig
): InputEventDriverAPI {
  const handlers = new Map<InputEventType, Set<InputEventHandler>>();
  const pressed = new Set<string>();
  let lastPointer: [number, number] | null = null;
  let gestureThreshold = config.gestureThreshold ?? 10;

  const emit = (event: NormalizedInputEvent) => {
    for (const handler of handlers.get(event.type) ?? []) {
      handler(event);
    }
  };

  return {
    async initialize() {
      for (const type of [
        "pointerdown",
        "pointerup",
        "pointermove",
        "pointercancel",
        "keydown",
        "keyup",
        "keypress",
        "gesturestart",
        "gesturechange",
        "gestureend",
      ] as InputEventType[]) {
        handlers.set(type, new Set());
      }
      emit({ type: "gestureend", timestamp: Date.now(), target: config.rootElement });
    },
    on(type, handler) {
      if (!handlers.has(type)) {
        handlers.set(type, new Set());
      }
      handlers.get(type)?.add(handler);
    },
    off(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    isPointerPressed(pointerId) {
      if (pointerId) {
        return pressed.has(pointerId);
      }
      return pressed.size > 0;
    },
    getLastPointerPosition() {
      return lastPointer;
    },
    setGestureThreshold(pixels) {
      gestureThreshold = Math.max(0, pixels);
      void gestureThreshold;
    },
    async destroy() {
      handlers.forEach((set) => set.clear());
      pressed.clear();
      lastPointer = null;
    },
  };
}
