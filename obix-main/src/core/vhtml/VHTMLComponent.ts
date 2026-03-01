/**
 * VHTMLComponent.ts
 * 
 * Implementation of the OBIX Virtual HTML Component system. This class orchestrates
 * the state management, diffing, and patching processes using automaton state
 * minimization techniques pioneered by Nnamdi Okpala.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VNode, VNodeProps, createVNode } from './VHTMLNode';
import { VHTMLDiffer, DiffOptions, DiffResult } from './VHTMLDiff';
import { VHTMLPatcher, PatchOptions, PatchResult } from './VHTMLPatch';
import { DOPAdapter } from '../../dop/DOPAdapter';
import { StateType } from '../../dop/StateType';
import { HTMLAst } from '../../ast/html/optimizers/HTMLAst';
import { HTMLAstOptimizer } from '../../ast/html/optimizers/HTMLAstOptimizer';
import { ValidationResult } from '../../dop/ValidationResult';

/**
 * Options for VHTML component
 */
export interface VHTMLComponentOptions {
  /** Whether to enable state minimization */
  enableMinimization?: boolean;
  /** Whether to cache renders */
  enableRenderCache?: boolean;
  /** Whether to validate during renders */
  enableValidation?: boolean;
  /** Options for the differ */
  diffOptions?: DiffOptions;
  /** Options for the patcher */
  patchOptions?: PatchOptions;
  /** Initial state */
  initialState?: Record<string, any>;
  /** Component name */
  name?: string;
}

/**
 * Render statistics
 */
export interface RenderStats {
  /** Time taken for overall render in milliseconds */
  totalTime: number;
  /** Time taken for diffing in milliseconds */
  diffTime: number;
  /** Time taken for patching in milliseconds */
  patchTime: number;
  /** Number of DOM operations */
  domOperations: number;
  /** Number of patches */
  patchCount: number;
  /** Whether state minimization was used */
  usedStateMinimization: boolean;
  /** State minimization metrics if used */
  minimizationMetrics?: {
    /** Number of operations saved */
    operationsSaved: number;
    /** Optimization ratio */
    optimizationRatio: number;
  };
}

/**
 * Component lifecycle callbacks
 */
export interface ComponentLifecycle {
  /** Called before component mounts */
  beforeMount?: () => void;
  /** Called after component mounts */
  afterMount?: () => void;
  /** Called before component updates */
  beforeUpdate?: (prevState: Record<string, any>, nextState: Record<string, any>) => void;
  /** Called after component updates */
  afterUpdate?: (prevState: Record<string, any>, nextState: Record<string, any>) => void;
  /** Called before component unmounts */
  beforeUnmount?: () => void;
}

/**
 * VHTML Component implementation
 */
export class VHTMLComponent<T = Record<string, any>> implements ComponentLifecycle {
  /** Component name */
  public readonly name: string;
  /** Component options */
  private options: VHTMLComponentOptions;
  /** Current component state */
  private state: T;
  /** Previous component state */
  private prevState: T | null;
  /** Root virtual node */
  private vnode: VNode | null;
  /** Previous root virtual node */
  private prevVNode: VNode | null;
  /** DOM container element */
  private container: HTMLElement | null;
  /** Whether component is mounted */
  private isMounted: boolean;
  /** DOP Adapter for state management */
  private dopAdapter: DOPAdapter;
  /** State type for validation */
  private stateType: StateType<T>;
  /** Differ for computing virtual DOM diffs */
  private differ: VHTMLDiffer;
  /** Patcher for applying diffs to the DOM */
  private patcher: VHTMLPatcher;
  /** HTML AST optimizer */
  private astOptimizer: HTMLAstOptimizer;
  /** Render cache */
  private renderCache: Map<string, VNode>;
  /** Last render statistics */
  private lastRenderStats: RenderStats | null;
  /** Lifecycle callbacks */
  public beforeMount?: () => void;
  public afterMount?: () => void;
  public beforeUpdate?: (prevState: T, nextState: T) => void;
  public afterUpdate?: (prevState: T, nextState: T) => void;
  public beforeUnmount?: () => void;
  
  /**
   * Create a new VHTML component
   */
  constructor(options: VHTMLComponentOptions = {}) {
    this.options = {
      enableMinimization: true,
      enableRenderCache: true,
      enableValidation: true,
      ...options
    };
    
    this.name = options.name || 'VHTMLComponent';
    this.state = (options.initialState || {}) as T;
    this.prevState = null;
    this.vnode = null;
    this.prevVNode = null;
    this.container = null;
    this.isMounted = false;
    this.lastRenderStats = null;
    
    // Initialize DOP adapter
    this.dopAdapter = new DOPAdapter<T>({
      initialState: this.state as any,
      enableValidation: this.options.enableValidation
    });
    
    // Initialize state type
    this.stateType = new StateType<T>('ComponentState', this.state);
    
    // Initialize differ with automaton state minimization
    this.differ = new VHTMLDiffer({
      enableMinimization: this.options.enableMinimization,
      ...options.diffOptions
    });
    
    // Initialize patcher
    this.patcher = new VHTMLPatcher({
      enableMinimization: this.options.enableMinimization,
      ...options.patchOptions
    });
    
    // Initialize HTML AST optimizer
    this.astOptimizer = new HTMLAstOptimizer(this.options.enableMinimization);
    
    // Initialize render cache
    this.renderCache = new Map<string, VNode>();
  }
  
  /**
   * Mount the component to a DOM container
   */
  public mount(container: HTMLElement): void {
    if (this.isMounted) {
      throw new Error(`${this.name} is already mounted.`);
    }
    if (!container) {
      throw new Error(`Invalid container for ${this.name}.`);
    }
    this.container = container;
    this.prevState = { ...this.state };
    this.prevVNode = null;
    this.vnode = this.render();
    this.container.innerHTML = '';
    this.container.appendChild(this.vnode.el);
    this.isMounted = true;
    if (this.beforeMount) {
      this.beforeMount();
    }
    if (this.afterMount) {
      this.afterMount();
    }
  }
  /**
   * Unmount the component from the DOM
   */
  public unmount(): void {  
    if (!this.isMounted) {
      throw new Error(`${this.name} is not mounted.`);
    }
    if (this.beforeUnmount) {
      this.beforeUnmount();
    }
    this.container?.innerHTML = '';
    this.isMounted = false;
  }
    /**
     * Update the component state
        */  
    public update(newState: Partial<T>): void {
        if (!this.isMounted) {
            throw new Error(`${this.name} is not mounted.`);
        }
        this.prevState = { ...this.state };
        this.state = { ...this.state, ...newState } as T;
        if (this.beforeUpdate) {
            this.beforeUpdate(this.prevState, this.state);
        }
        this.vnode = this.render();
        this.diffAndPatch();
        if (this.afterUpdate) {
            this.afterUpdate(this.prevState, this.state);
        }
        }
        
    /**
     * Render the component
     *  */
    public render(): VNode {
        if (this.options.enableRenderCache) {
            const cacheKey = JSON.stringify(this.state);
            if (this.renderCache.has(cacheKey)) {
                return this.renderCache.get(cacheKey)!;
            }
        }
        const vnode = createVNode(this.state, this.name);
        if (this.options.enableRenderCache) {
            const cacheKey = JSON.stringify(this.state);
            this.renderCache.set(cacheKey, vnode);
        }
        return vnode;
    }
    /**
     * Diff and patch the component
     */
    public diffAndPatch(): void {
        if (!this.vnode || !this.container) {
            throw new Error(`Cannot diff and patch without a vnode or container.`);
        }
        const startTime = performance.now();
        const diffResult: DiffResult = this.differ.diff(this.prevVNode, this.vnode);
        const diffTime = performance.now() - startTime;
        
        const patchStartTime = performance.now();
        const patchResult: PatchResult = this.patcher.patch(this.container, diffResult);
        const patchTime = performance.now() - patchStartTime;
        
        this.lastRenderStats = {
            totalTime: diffTime + patchTime,
            diffTime,
            patchTime,
            domOperations: patchResult.domOperations,
            patchCount: patchResult.patchCount,
            usedStateMinimization: this.options.enableMinimization,
            minimizationMetrics: this.differ.getMinimizationMetrics()
        };
        this.prevVNode = this.vnode;
        this.prevState = { ...this.state };
        this.vnode = null;
        this.prevVNode = null;
        this.renderCache.clear();
        this.dopAdapter.updateState(this.state);
        this.dopAdapter.validateState(this.state);
        this.dopAdapter.notifyStateChange(this.state);
    }
    /**
     * Get the last render statistics
     */
    public getRenderStats(): RenderStats | null {
        return this.lastRenderStats;
    }
    /**
     * Get the current state
     * */
    public getState(): T {
        return this.state;
    }
    /**
     * Set the current state
     * */
    public setState(newState: Partial<T>): void {
        this.state = { ...this.state, ...newState } as T;
        if (this.isMounted) {
            this.update(this.state);
        }
    }
    /**
     * Get the current DOP adapter
     */
    public getDOPAdapter(): DOPAdapter {
        return this.dopAdapter;
    }
    
    /**
     * Reset the component state
     */
    public resetState(newState?: Partial<T>): void {
        this.state = newState ? { ...this.state, ...newState } as T : (this.options.initialState || {}) as T;
        if (this.isMounted) {
            this.update(this.state);
        }
    }
    
    /**
     * Force a re-render of the component
     */
    public forceUpdate(): void {
        if (this.isMounted) {
            this.vnode = this.render();
            this.diffAndPatch();
        }
    }
    
        /**
         * Check if component is mounted
         */
        public isMountedComponent(): boolean {
            return this.isMounted;
        }
    }