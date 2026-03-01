/**
 * Unit Test Sequencer for OBIX Framework
 * 
 * Custom test sequencer to optimize test execution for the OBIX framework.
 * Prioritizes critical modules and enables parallel execution where appropriate.
 * 
 * @module tests/utils/unitTestSequencer
 */

import Sequencer from '@jest/test-sequencer';
import path from 'path';
import fs from 'fs';

// Map to cache test file information to avoid repeated file operations
const testInfoCache = new Map();

/**
 * Helper function to check if a test has integration dependencies
 * @param {string} testPath - Path to the test file
 * @returns {boolean} - True if the test has integration dependencies
 */
function hasIntegrationDependencies(testPath) {
  if (!testInfoCache.has(testPath)) {
    try {
      const content = fs.readFileSync(testPath, 'utf8');
      const hasIntegration = content.includes('@integration') || 
                            content.includes('require(\'../integration/') ||
                            content.includes('from \'../integration/');
      testInfoCache.set(testPath, { hasIntegration });
    } catch (error) {
      console.warn(`Warning: Could not analyze test file ${testPath}`, error.message);
      testInfoCache.set(testPath, { hasIntegration: false });
    }
  }
  
  return testInfoCache.get(testPath).hasIntegration;
}

/**
 * Custom test sequencer implementation that orders tests by module priority
 * and optimizes test execution for the OBIX framework.
 */
class OBIXTestSequencer extends Sequencer {
  /**
   * Sort test paths based on module priority and dependencies
   * @param {Array<Test>} tests - Array of test objects to sort
   * @returns {Array<Test>} - Sorted array of tests
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
   * @param {string} testPath - Path to the test file
   * @returns {number} - Priority value (lower is higher priority)
   */
  getModulePriority(testPath) {
    // Extract relevant module information from the test path
    const relativePath = path.relative(process.cwd(), testPath);
    
    // Prioritize modules based on dependencies
    if (relativePath.includes('/core/dop/data/')) {
      return 1; // Data models should be tested first (foundation)
    }
    
    if (relativePath.includes('/core/dop/behavior/')) {
      return 2; // Behavior models depend on data models
    }
    
    if (relativePath.includes('/core/dop/validation/')) {
      return 3; // Validation depends on behavior and data
    }
    
    if (relativePath.includes('/core/dop/adapter/')) {
      return 4; // Adapters depend on all previous modules
    }
    
    if (relativePath.includes('/core/dop/')) {
      return 5; // Other DOP module tests
    }
    
    if (relativePath.includes('/core/automaton/')) {
      return 6; // Automaton tests
    }
    
    if (relativePath.includes('/core/')) {
      return 7; // Other core module tests
    }
    
    return 100; // Default priority for other tests
  }
}

export default OBIXTestSequencer;