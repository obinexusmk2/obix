
/**
 * core/api/shared/implementations/ComponentLifecycleManager.ts
 * 
 * Implementation of lifecycle management for components
 */

import { LifecycleHooks, LifecyclePhase } from "../validation/ValidationComponent";

/**
 * Manages component lifecycle hooks
 */
export class LifecycleManager {
  /**
   * Registered lifecycle hooks
   */
  public hooks: LifecycleHooks;
  
  /**
   * Current lifecycle phase
   */
  public currentPhase: LifecyclePhase = LifecyclePhase.CREATED;
  
  /**
   * Create a new LifecycleManager
   * 
   * @param hooks Initial lifecycle hooks
   */
  constructor(hooks: LifecycleHooks = {}) {
    this.hooks = hooks;
  }
  
  /**
   * Executes a lifecycle hook if it exists
   * 
   * @param hook The hook to execute
   * @param args Arguments to pass to the hook
   */
  public executeHook(hook: keyof LifecycleHooks, ...args: any[]): void {
    // Update current phase based on hook
    this.updatePhaseForHook(hook);
    
    // Execute hook if it exists
    const hookFn = this.hooks[hook];
    if (typeof hookFn === 'function') {
      try {
        (hookFn as (...args: any[]) => void)(...args);
      } catch (error) {
        console.error(`Error executing ${String(hook)} hook:`, error);
        
        // Call error hook if available
        if (hook !== 'onError' && this.hooks.onError) {
          this.hooks.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }
  
  /**
   * Gets the registered lifecycle hooks
   * 
   * @returns Registered lifecycle hooks
   */
  public getHooks(): LifecycleHooks {
    return this.hooks as LifecycleHooks;
  }
  /**
   * Registers lifecycle hooks
   * 
   * @param hooks Hooks to register
   */
  public registerHooks(hooks: Partial<LifecycleHooks>): void {
    this.hooks = {
      ...this.hooks,
      ...hooks
    };
  }
  
  /**
   * Gets the current lifecycle phase
   * 
   * @returns Current lifecycle phase
   */
  public getCurrentPhase(): LifecyclePhase {
    return this.currentPhase;
  }
  
  /**
   * Updates the current phase based on hook
   * 
   * @public
   * @param hook The hook being executed
   */
  public updatePhaseForHook(hook: keyof LifecycleHooks): void {
    switch (hook) {
      case 'onBeforeMount':
        this.currentPhase = LifecyclePhase.BEFORE_MOUNT;
        break;
      case 'onMounted':
        this.currentPhase = LifecyclePhase.MOUNTED;
        break;
      case 'onBeforeUpdate':
        this.currentPhase = LifecyclePhase.BEFORE_UPDATE;
        break;
      case 'onUpdated':
        this.currentPhase = LifecyclePhase.UPDATED;
        break;
      case 'onBeforeUnmount':
        this.currentPhase = LifecyclePhase.BEFORE_UNMOUNT;
        break;
      case 'onUnmounted':
        this.currentPhase = LifecyclePhase.UNMOUNTED;
        break;
      case 'onError':
        this.currentPhase = LifecyclePhase.ERROR;
        break;
    }
  }
}