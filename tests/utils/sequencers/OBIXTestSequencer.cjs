/**
 * OBIX Test Sequencer (CommonJS format)
 * 
 * Custom test sequencer to optimize test execution order for
 * the OBIX framework according to dependencies between modules.
 * 
 * This sequencer ensures tests are run in an order that respects
 * module dependencies, preventing test failures due to dependency order.
 */

const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

// Map to cache test file information to avoid repeated file operations
const testInfoCache = new Map();

/**
 * Custom test sequencer implementation that orders tests by module priority
 * and optimizes test execution for the OBIX framework.
 * 
 * This implementation follows Nnamdi Okpala's requirement for module ordering
 * to ensure that dependent components are tested after their dependencies.
 */
class OBIXTestSequencer extends Sequencer {
  /**
   * Sort test paths based on module priority and dependencies
   * @param tests Array of test objects to sort
   * @returns Sorted array of tests
   */
  sort(tests) {
    // Return a new array of tests sorted by the priority of modules
    return Array.from(tests).sort((testA, testB) => {
      // Extract module paths
      const pathA = testA.path;
      const pathB = testB.path;
      
      // Get the priority for both tests
      const priorityA = this.getModulePriority(pathA);
      const priorityB = this.getModulePriority(pathB);
      
      // Sort by priority (lower priority number = higher priority)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priority is the same, sort alphabetically for stable ordering
      return pathA.localeCompare(pathB);
    });
  }
  
  /**
   * Get the priority value for a test module to establish execution order
   * Core modules with dependencies should be tested first
   * @param testPath Path to the test file
   * @returns Priority value (lower is higher priority)
   */
  getModulePriority(testPath) {
    // Extract relevant module information from the test path
    const relativePath = path.relative(process.cwd(), testPath);
    
    // Base data types and constants have highest priority
    if (relativePath.includes('/core/types/') || relativePath.includes('/core/constants/')) {
      return 1;
    }
    
    // Core utilities come next
    if (relativePath.includes('/core/utils/')) {
      return 2;
    }
    
    // Data models should be tested early (foundation)
    if (relativePath.includes('/core/dop/data/')) {
      return 3;
    }
    
    // Behavior models depend on data models
    if (relativePath.includes('/core/dop/behavior/')) {
      return 4;
    }
    
    // Validation depends on behavior and data
    if (relativePath.includes('/core/dop/validation/')) {
      return 5;
    }
    
    // Adapters depend on all previous modules
    if (relativePath.includes('/core/dop/adapter/')) {
      return 6;
    }
    
    // Other DOP module tests
    if (relativePath.includes('/core/dop/')) {
      return 7;
    }
    
    // Automaton state minimization tests
    if (relativePath.includes('/core/automaton/')) {
      return 8;
    }
    
    // HTML parser components
    if (relativePath.includes('/core/parser/html/')) {
      return 9;
    }
    
    // CSS parser components
    if (relativePath.includes('/core/parser/css/')) {
      return 10;
    }
    
    // Other core module tests
    if (relativePath.includes('/core/')) {
      return 11;
    }
    
    // Integration suites after all unit tests
    if (relativePath.includes('/integration/')) {
      return 20;
    }
    
    return 100; // Default priority for other tests
  }
}

module.exports = OBIXTestSequencer;