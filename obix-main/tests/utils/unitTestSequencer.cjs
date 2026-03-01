/**
 * Unit Test Sequencer for OBIX Tests
 * 
 * Prioritizes test execution based on dependencies.
 */
const Sequencer = require('@jest/test-sequencer').default;

class UnitTestSequencer extends Sequencer {
  /**
   * Sort test paths for optimal test execution
   */
  sort(tests) {
    // Helper function to determine test priority
    const getPriority = (path) => {
      if (path.includes('/core/types/')) return 1;
      if (path.includes('/core/constants/')) return 2;
      if (path.includes('/core/utils/')) return 3;
      if (path.includes('/core/dop/data/')) return 4;
      if (path.includes('/core/dop/behavior/')) return 5;
      if (path.includes('/core/dop/validation/')) return 6;
      if (path.includes('/core/dop/adapter/')) return 7;
      // Default priority for other tests
      return 50;
    };

    // Sort based on priority (lower runs first)
    return [...tests].sort((a, b) => {
      const priorityA = getPriority(a.path);
      const priorityB = getPriority(b.path);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // For equal priority, maintain stable sort
      return a.path.localeCompare(b.path);
    });
  }
}

module.exports = UnitTestSequencer;
