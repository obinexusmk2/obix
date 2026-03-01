

/**
 * core/api/shared/implementations/EventBus.ts
 * 
 * Implementation of an event bus for component communication
 */

/**
 * Event listener type
 */
export type EventListener = (payload?: any) => void;

/**
 * Manages event-based communication between components
 */
export class EventBus {
  /**
   * Map of event names to sets of listeners
   */
  public listeners: Map<string, Set<EventListener>> = new Map();
  
  /**
   * Registers an event listener
   * 
   * @param event Event name
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  public on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => this.off(event, listener);
  }
  
  /**
   * Removes an event listener
   * 
   * @param event Event name
   * @param listener Listener function to remove
   */
  public off(event: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      
      // Remove the event from the map if no listeners remain
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * Emits an event to all registered listeners
   * 
   * @param event Event name
   * @param payload Optional event payload
   */
  public emit(event: string, payload?: any): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;
    
    for (const listener of eventListeners) {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }
  }
  
  /**
   * Registers a one-time event listener
   * 
   * @param event Event name
   * @param listener Listener function
   */
  public once(event: string, listener: EventListener): void {
    const onceListener = (payload?: any) => {
      // Remove this listener
      this.off(event, onceListener);
      
      // Call the original listener
      listener(payload);
    };
    
    this.on(event, onceListener);
  }
  
  /**
   * Checks if an event has listeners
   * 
   * @param event Event name
   * @returns True if the event has listeners
   */
  public hasListeners(event: string): boolean {
    const eventListeners = this.listeners.get(event);
    return !!eventListeners && eventListeners.size > 0;
  }
  
  /**
   * Removes all listeners for an event
   * 
   * @param event Event name
   */
  public clearEvent(event: string): void {
    this.listeners.delete(event);
  }
  
  /**
   * Removes all event listeners
   */
  public clearAll(): void {
    this.listeners.clear();
  }
}