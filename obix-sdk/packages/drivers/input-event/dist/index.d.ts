/**
 * Input Event Driver
 * Unified touch/mouse/keyboard/pointer event normalization
 */
export type InputEventType = "pointerdown" | "pointerup" | "pointermove" | "pointercancel" | "keydown" | "keyup" | "keypress" | "gesturestart" | "gesturechange" | "gestureend";
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
    /** Root element to attach listeners to */
    rootElement: Element;
    /** Normalize touch events */
    normalizeTouch?: boolean;
    /** Use pointer capture */
    pointerCapture?: boolean;
    /** Gesture detection threshold in pixels */
    gestureThreshold?: number;
}
export type InputEventHandler = (event: NormalizedInputEvent) => void;
export interface InputEventDriverAPI {
    /** Initialize input event driver */
    initialize(): Promise<void>;
    /** Register input event listener */
    on(type: InputEventType, handler: InputEventHandler): void;
    /** Remove input event listener */
    off(type: InputEventType, handler: InputEventHandler): void;
    /** Check if pointer is currently pressed */
    isPointerPressed(pointerId?: string): boolean;
    /** Get last pointer position */
    getLastPointerPosition(): [number, number] | null;
    /** Set gesture threshold */
    setGestureThreshold(pixels: number): void;
    /** Destroy the driver */
    destroy(): Promise<void>;
}
export declare function createInputEventDriver(config: InputEventDriverConfig): InputEventDriverAPI;
//# sourceMappingURL=index.d.ts.map