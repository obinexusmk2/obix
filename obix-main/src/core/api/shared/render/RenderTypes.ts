/**
 * Supported render output types
 */
export type RenderOutput = HTMLElement | string | null;

/**
 * Component render function signature
 */
export type RenderFunction<S = any> = (state: S) => RenderOutput;

/**
 * Component render template signature
 */
export type RenderTemplate = string;

