/**
 * ObixComponent.ts
 * 
 * Core component for the OBIX framework that integrates HTML and CSS processing
 * using Nnamdi Okpala's automaton state minimization technology. This component
 * provides a unified API that works across both functional and OOP paradigms.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { HTMLASTProcessor } from '../ast/html/HTMLASTProcessor';
import { CSSASTProcessor } from '../ast/css/CSSASTProcessor';
import { DOMPatchManager } from '../vdom/DOMPatchManager';
import { DOMAdapter, DOMAdapterOptions } from '../adapters/DOMAdapter';
import { DOPAdapter } from '../adapters/DOPAdapter';
import { HTMLVNode } from '../vdom/HTMLVNode';
import { CSSVNode } from '../vdom/CSSVNode';
import { CompositeVNode } from '../vdom/CompositeVNode';
import { Performance } from '../utils/Performance';
import { StateMachineData } from '../ast/common/StateMachineData';
import { LRUCache } from '../cache/LRUCache';

/**
 * Configuration options for ObixComponent
 */
export interface ObixComponentOptions {
  /**
   * Functional programming mode (default: false)
   */
  functionalMode?: boolean;
  
  /**
   * Whether to enable state minimization (default: true)
   */
  enableMinimization?: boolean;
  
  /**
   * Whether to enable validation (default: true)
   */
  enableValidation?: boolean;
  
  /**
   * Whether to enable performance tracking (default: true)
   */
  enablePerformanceTracking?: boolean;
  
  /**
   * Size of component cache (default: 50)
   */
  cacheSize?: number;
  
  /**
   * DOM adapter options
   */
  domAdapterOptions?: DOMAdapterOptions;
}

/**
 * Component state type
 */
export type ComponentState = Record<string, any>;

/**
 * Component rendering result
 */
export interface RenderResult {
  /**
   * Virtual DOM node
   */
  vdom: CompositeVNode;
  
  /**
   * Performance metrics
   */
  performance: {
    parseTime: number;
    optimizeTime: number;
    renderTime: number;
    totalTime: number;
  };
  
  /**
   * Validation information
   */
  validation: {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
  };
  
  /**
   * State machine metrics
   */
  stateMachine: {
    stateCount: number;
    transitionCount: number;
    equivalenceClassCount: number;
    optimizationRatio: number;
  };
}

/**
 * Core component for the OBIX framework
 */
export class ObixComponent<T extends ComponentState = ComponentState> {
  /**
   * HTML processor
   */
  private htmlProcessor: HTMLASTProcessor;
  
  /**
   * CSS processor
   */
  private cssProcessor: CSSASTProcessor;
  
  /**
   * DOM patch manager
   */
  private domPatchManager: DOMPatchManager;
  
  /**
   * DOM adapter
   */
  private domAdapter: DOMAdapter;
  
  /**
   * Data-oriented programming adapter
   */
  private dopAdapter: DOPAdapter;
  
  /**
   * Component options
   */
  private options: ObixComponentOptions;
  
  /**
   * Component state
   */
  private state: T;
  
  /**
   * Previous VDOM for diffing
   */
  private previousVDOM: CompositeVNode | null = null;
  
  /**
   * Component cache
   */
  private cache: LRUCache<string, RenderResult>;
  
  /**
   * Performance tracker
   */
  private performance: Performance;
  
  /**
   * Whether the component is mounted
   */
  private isMounted: boolean = false;
  
  /**
   * Target DOM element
   */
  private targetElement: HTMLElement | null = null;
  
  /**
   * Create a new OBIX component
   * 
   * @param initialState Initial component state
   * @param options Component options
   */
  constructor(initialState: T, options: ObixComponentOptions = {}) {
    this.options = {
      functionalMode: false,
      enableMinimization: true,
      enableValidation: true,
      enablePerformanceTracking: true,
      cacheSize: 50,
      ...options
    };
    
    this.state = { ...initialState };
    
    // Initialize processors
    this.htmlProcessor = new HTMLASTProcessor({
      enableValidation: this.options.enableValidation,
      applyMemoryOptimizations: this.options.enableMinimization,
      cacheSize: this.options.cacheSize
    });
    
    this.cssProcessor = new CSSASTProcessor({
      enableValidation: this.options.enableValidation,
      applyMemoryOptimizations: this.options.enableMinimization,
      cacheSize: this.options.cacheSize
    });
    
    // Initialize DOM management
    this.domPatchManager = new DOMPatchManager();
    this.domAdapter = new DOMAdapter(this.options.domAdapterOptions);
    
    // Initialize DOP adapter
    this.dopAdapter = new DOPAdapter({
      functionalMode: this.options.functionalMode
    });
    
    // Initialize cache and performance tracking
    this.cache = new LRUCache<string, RenderResult>(
      this.options.cacheSize || 50
    );
    
    this.performance = new Performance({
      enabled: this.options.enablePerformanceTracking
    });
  }
  
  /**
   * Mount the component to a DOM element
   * 
   * @param element Target DOM element
   * @returns This component for chaining
   */
  public mount(element: HTMLElement | string): ObixComponent<T> {
    // Resolve element if string selector provided
    if (typeof element === 'string') {
      const resolvedElement = document.querySelector(element);
      if (!resolvedElement || !(resolvedElement instanceof HTMLElement)) {
        throw new Error(`Could not find element with selector: ${element}`);
      }
      element = resolvedElement;
    }
    
    this.targetElement = element;
    this.isMounted = true;
    
    // Perform initial render
    this.render();
    
    return this;
  }
  
  /**
   * Update component state
   * 
   * @param newState New state to merge with current state
   * @param callback Optional callback after state update
   * @returns This component for chaining
   */
  public setState(newState: Partial<T>, callback?: () => void): ObixComponent<T> {
    // Merge new state with current state
    this.state = {
      ...this.state,
      ...newState
    };
    
    // Render with new state
    if (this.isMounted) {
      this.render();
    }
    
    // Call callback if provided
    if (callback) {
      callback();
    }
    
    return this;
  }
  
  /**
   * Render the component
   * 
   * @returns Render result
   */
  public render(): RenderResult {
    this.performance.start('render');
    
    try {
      // Generate HTML and CSS based on current state
      const { html, css } = this.generateTemplate();
      
      // Create cache key from HTML and CSS
      const cacheKey = `${html}|||${css}`;
      
      // Check cache for existing result
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        this.applyToDOM(cachedResult.vdom);
        return cachedResult;
      }
      
      // Process HTML
      this.performance.start('html-processing');
      const processedHTML = this.htmlProcessor.process(html);
      this.performance.end('html-processing');
      
      // Process CSS
      this.performance.start('css-processing');
      const processedCSS = this.cssProcessor.process(css);
      this.performance.end('css-processing');
      
      // Create composite VDOM
      this.performance.start('vdom-creation');
      const vdom = this.createCompositeVDOM(
        processedHTML.virtualDOM,
        processedCSS.virtualDOM
      );
      this.performance.end('vdom-creation');
      
      // Apply to DOM if mounted
      if (this.isMounted && this.targetElement) {
        this.applyToDOM(vdom);
      }
      
      // Create render result
      const result: RenderResult = {
        vdom,
        performance: {
          parseTime: this.performance.get('html-processing') + this.performance.get('css-processing'),
          optimizeTime: processedHTML.metrics.performance.minimizeTime + processedCSS.metrics.performance.minimizeTime,
          renderTime: this.performance.get('vdom-creation'),
          totalTime: this.performance.get('render')
        },
        validation: {
          isValid: processedHTML.validationResult.isValid && processedCSS.validationResult.isValid,
          errorCount: processedHTML.validationResult.errors.length + processedCSS.validationResult.errors.length,
          warningCount: processedHTML.validationResult.warnings.length + processedCSS.validationResult.warnings.length
        },
        stateMachine: {
          stateCount: this.countStates(vdom),
          transitionCount: this.countTransitions(vdom),
          equivalenceClassCount: processedHTML.metrics.stateClasses.count + processedCSS.metrics.stateClasses.count,
          optimizationRatio: (processedHTML.metrics.nodeReduction.ratio + processedCSS.metrics.nodeReduction.ratio) / 2
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
      
    } finally {
      this.performance.end('render');
    }
  }
  
  /**
   * Generate HTML and CSS template based on current state
   * 
   * @returns HTML and CSS templates
   */
  private generateTemplate(): { html: string; css: string } {
    // In a real implementation, this would use a templating system
    // For this example, we'll return placeholder values
    return {
      html: `<div class="obix-component">
        <h1>${this.state.title || 'OBIX Component'}</h1>
        <div class="content">${this.state.content || ''}</div>
      </div>`,
      css: `
        .obix-component {
          font-family: sans-serif;
          color: ${this.state.textColor || '#333'};
          background-color: ${this.state.backgroundColor || '#fff'};
          padding: 20px;
          border-radius: 4px;
        }
        .obix-component h1 {
          font-size: 24px;
          margin-bottom: 16px;
        }
        .content {
          line-height: 1.5;
        }
      `
    };
  }
  
  /**
   * Create a composite virtual DOM from HTML and CSS VNodes
   * 
   * @param htmlVNode HTML virtual DOM
   * @param cssVNode CSS virtual DOM
   * @returns Composite virtual DOM
   */
  private createCompositeVDOM(htmlVNode: HTMLVNode, cssVNode: CSSVNode): CompositeVNode {
    return new CompositeVNode(htmlVNode, cssVNode);
  }
  
  /**
   * Apply virtual DOM to the target DOM element
   * 
   * @param vdom Virtual DOM to apply
   */
  private applyToDOM(vdom: CompositeVNode): void {
    if (!this.targetElement) {
      return;
    }
    
    this.performance.start('dom-patching');
    
    try {
      // Use DOM patch manager to efficiently update the DOM
      this.domPatchManager.applyPatches(
        this.previousVDOM, 
        vdom, 
        this.targetElement
      );
      
      // Store current VDOM for future diffing
      this.previousVDOM = vdom;
    } finally {
      this.performance.end('dom-patching');
    }
  }
  
  /**
   * Count total states in a virtual DOM tree
   * 
   * @param vdom Virtual DOM to analyze
   * @returns Number of states
   */
  private countStates(vdom: CompositeVNode): number {
    let count = 0;
    
    // Use DOP adapter to ensure consistent counting across paradigms
    const countStatesInNode = (node: any): void => {
      count++;
      
      // Check for children using adapter to handle both paradigms
      const children = this.dopAdapter.getChildren(node);
      if (children && Array.isArray(children)) {
        for (const child of children) {
          countStatesInNode(child);
        }
      }
    };
    
    countStatesInNode(vdom);
    return count;
  }
  
  /**
   * Count total transitions in a virtual DOM tree
   * 
   * @param vdom Virtual DOM to analyze
   * @returns Number of transitions
   */
  private countTransitions(vdom: CompositeVNode): number {
    let count = 0;
    
    // Use DOP adapter to ensure consistent counting across paradigms
    const countTransitionsInNode = (node: any): void => {
      // Get state machine data using adapter
      const stateMachine = this.dopAdapter.getStateMachine(node) as StateMachineData | undefined;
      
      if (stateMachine && stateMachine.transitions) {
        count += stateMachine.transitions.size;
      }
      
      // Check for children using adapter to handle both paradigms
      const children = this.dopAdapter.getChildren(node);
      if (children && Array.isArray(children)) {
        for (const child of children) {
          countTransitionsInNode(child);
        }
      }
    };
    
    countTransitionsInNode(vdom);
    return count;
  }
  
  /**
   * Get current component state
   * 
   * @returns Current state
   */
  public getState(): T {
    return { ...this.state };
  }
  
  /**
   * Get performance metrics
   * 
   * @returns Performance metrics
   */
  public getPerformanceMetrics(): Record<string, number> {
    return this.performance.getAll();
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    missRate: number;
  } {
    return {
      size: this.cache.size(),
      hitRate: this.cache.hitRate(),
      missRate: 1 - this.cache.hitRate()
    };
  }
  
  /**
   * Clear component cache
   * 
   * @returns This component for chaining
   */
  public clearCache(): ObixComponent<T> {
    this.cache.clear();
    this.htmlProcessor.clearCache();
    this.cssProcessor.clearCache();
    return this;
  }
  
  /**
   * Unmount the component
   */
  public unmount(): void {
    if (this.targetElement) {
      // Clear the target element
      this.targetElement.innerHTML = '';
      this.targetElement = null;
      this.isMounted = false;
      this.previousVDOM = null;
    }
  }
  
  /**
   * Create a component in functional style
   * 
   * @param template Template function
   * @param initialState Initial state
   * @param options Component options
   * @returns New ObixComponent
   */
  public static createFunctional<S extends ComponentState>(
    template: (state: S) => { html: string; css: string },
    initialState: S,
    options: ObixComponentOptions = {}
  ): ObixComponent<S> {
    // Create component with functional mode enabled
    const component = new ObixComponent<S>(initialState, {
      ...options,
      functionalMode: true
    });
    
    // Override template generation
    component['generateTemplate'] = () => template(component.getState());
    
    return component;
  }
}