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
export declare function createInputEventDriver(config: InputEventDriverConfig): InputEventDriverAPI;
//# sourceMappingURL=index.d.ts.map