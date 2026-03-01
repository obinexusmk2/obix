/**
 * Utility functions for asynchronous operations
 */

/**
 * Promise timeout wrapper
 * 
 * @param promise Promise to wrap with timeout
 * @param timeoutMs Timeout in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns Promise that rejects if the timeout is reached
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });
    
    return Promise.race([
      promise.then(result => {
        clearTimeout(timeoutId);
        return result;
      }),
      timeoutPromise
    ]);
  }
  
  /**
   * Create a deferred promise that can be resolved or rejected externally
   * 
   * @returns Deferred promise object
   */
  export function createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
    isPending: () => boolean;
  } {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    let isPending = true;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = (value) => {
        isPending = false;
        res(value);
      };
      reject = (reason) => {
        isPending = false;
        rej(reason);
      };
    });
    
    return {
      promise,
      resolve,
      reject,
      isPending: () => isPending
    };
  }
  
  /**
   * Delay execution for a specified duration
   * 
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Retry a function with exponential backoff
   * 
   * @param fn Function to retry
   * @param options Retry options
   * @returns Promise that resolves with the function result
   */
  export async function retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      backoffFactor?: number;
      shouldRetry?: (error: any, attempt: number) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelayMs = 100,
      maxDelayMs = 5000,
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;
    
    let lastError: any;
    let delayMs = initialDelayMs;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Wait with exponential backoff
        await delay(delayMs);
        
        // Calculate next delay (with max limit)
        delayMs = Math.min(delayMs * backoffFactor, maxDelayMs);
      }
    }
    
    throw lastError;
  }
  
  /**
   * Run operations with a semaphore for concurrency control
   */
  export class Semaphore {
    public permits: number;
    public waiting: Array<() => void> = [];
    
    /**
     * Create a new semaphore
     * 
     * @param maxConcurrent Maximum number of concurrent operations
     */
    constructor(maxConcurrent: number) {
      this.permits = maxConcurrent;
    }
    
    /**
     * Acquire a permit to perform an operation
     * 
     * @returns Promise that resolves when a permit is available
     */
    async acquire(): Promise<void> {
      if (this.permits > 0) {
        this.permits--;
        return Promise.resolve();
      }
      
      return new Promise<void>(resolve => {
        this.waiting.push(resolve);
      });
    }
    
    /**
     * Release a permit after an operation is complete
     */
    release(): void {
      const waiter = this.waiting.shift();
      
      if (waiter) {
        waiter();
      } else {
        this.permits++;
      }
    }
    
    /**
     * Run a function with semaphore control
     * 
     * @param fn Function to run with acquired permit
     * @returns Promise that resolves with the function result
     */
    async use<T>(fn: () => Promise<T>): Promise<T> {
      await this.acquire();
      
      try {
        return await fn();
      } finally {
        this.release();
      }
    }
    
    /**
     * Get the number of available permits
     */
    get availablePermits(): number {
      return this.permits;
    }
    
    /**
     * Get the number of waiting operations
     */
    get waitingCount(): number {
      return this.waiting.length;
    }
  }
  
  /**
   * Run multiple operations with limited concurrency
   * 
   * @param tasks Array of tasks to run
   * @param concurrency Maximum number of concurrent tasks
   * @returns Promise that resolves with array of results
   */
  export async function parallelLimit<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number
  ): Promise<T[]> {
    const semaphore = new Semaphore(concurrency);
    return Promise.all(tasks.map(task => semaphore.use(task)));
  }
  
  /**
   * Create a cancelable promise
   * 
   * @param promise Original promise
   * @returns Object with promise and cancel function
   */
  export function makeCancelable<T>(promise: Promise<T>): {
    promise: Promise<T>;
    cancel: (reason?: string) => void;
  } {
    let isCanceled = false;
    const cancelReason = 'Operation canceled';
    
    const wrappedPromise = new Promise<T>((resolve, reject) => {
      promise.then(
        value => isCanceled ? reject(new Error(cancelReason)) : resolve(value),
        error => reject(isCanceled ? new Error(cancelReason) : error)
      );
    });
    
    return {
      promise: wrappedPromise,
      cancel: (_reason = cancelReason) => {
        isCanceled = true;
      }
    };
  }