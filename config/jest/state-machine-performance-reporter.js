// config/jest/state-machine-performance-reporter.js
const fs = require('fs');
const path = require('path');

/**
 * Custom Jest reporter for collecting automaton state minimization performance metrics
 * This reporter tracks and reports on the performance of state machine operations
 * to help optimize the OBIX library's core algorithms.
 */
class StateMachinePerformanceReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    this._metrics = {
      testSuites: [],
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        totalDuration: 0,
        
        // State machine specific metrics
        stateMinimizationAvgTime: 0,
        equivalenceClassComputeAvgTime: 0,
        transitionOptimizationAvgTime: 0,
        stateReductionAvgRatio: 0,
        
        smallMachineAvgTime: 0,   // <= 10 states
        mediumMachineAvgTime: 0,  // 11-100 states
        largeMachineAvgTime: 0    // > 100 states
      }
    };
  }

  onRunStart() {
    console.log('\nState Machine Performance Reporter initialized');
    this._startTime = Date.now();
  }

  onTestStart(test) {
    // No action needed
  }

  onTestResult(test, testResult) {
    const { numPassingTests, numFailingTests, numPendingTests, testResults, perfStats } = testResult;
    const duration = perfStats.end - perfStats.start;
    
    // Track basic test metrics
    this._metrics.summary.totalTests += testResults.length;
    this._metrics.summary.totalPassed += numPassingTests;
    this._metrics.summary.totalFailed += numFailingTests;
    this._metrics.summary.totalSkipped += numPendingTests;
    this._metrics.summary.totalDuration += duration;
    
    // Create a test suite record
    const testSuite = {
      name: test.path,
      duration,
      tests: [],
      summary: {
        passed: numPassingTests,
        failed: numFailingTests,
        skipped: numPendingTests,
        total: testResults.length
      },
      stateMachineMetrics: []
    };
    
    // Process individual test results
    for (const result of testResults) {
      // Extract any state machine metrics from the test results
      if (result.title.includes('state machine') || result.title.includes('automaton')) {
        const stateMetrics = this.extractStateMachineMetrics(result);
        
        if (stateMetrics) {
          testSuite.stateMachineMetrics.push(stateMetrics);
          
          // Update summary metrics based on machine size
          if (stateMetrics.stateCount <= 10) {
            this.updateAverage('smallMachineAvgTime', stateMetrics.minimizationTime);
          } else if (stateMetrics.stateCount <= 100) {
            this.updateAverage('mediumMachineAvgTime', stateMetrics.minimizationTime);
          } else {
            this.updateAverage('largeMachineAvgTime', stateMetrics.minimizationTime);
          }
          
          // Update other summary metrics
          this.updateAverage('stateMinimizationAvgTime', stateMetrics.minimizationTime);
          this.updateAverage('equivalenceClassComputeAvgTime', stateMetrics.equivalenceClassTime);
          this.updateAverage('transitionOptimizationAvgTime', stateMetrics.transitionTime);
          this.updateAverage('stateReductionAvgRatio', stateMetrics.stateReductionRatio);
        }
      }
      
      testSuite.tests.push({
        title: result.title,
        status: result.status,
        duration: result.duration
      });
    }
    
    this._metrics.testSuites.push(testSuite);
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const totalDuration = endTime - this._startTime;
    
    console.log('\nState Machine Performance Report:');
    console.log('-------------------------------');
    console.log(`Total test suites: ${this._metrics.testSuites.length}`);
    console.log(`Tests: ${this._metrics.summary.totalTests} (${this._metrics.summary.totalPassed} passed, ${this._metrics.summary.totalFailed} failed, ${this._metrics.summary.totalSkipped} skipped)`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log('\nState Machine Optimization Metrics:');
    console.log(`State minimization average time: ${this._metrics.summary.stateMinimizationAvgTime.toFixed(2)}ms`);
    console.log(`State reduction average ratio: ${(this._metrics.summary.stateReductionAvgRatio * 100).toFixed(2)}%`);
    console.log('\nPerformance by machine size:');
    console.log(`Small machines (<=10 states): ${this._metrics.summary.smallMachineAvgTime.toFixed(2)}ms`);
    console.log(`Medium machines (11-100 states): ${this._metrics.summary.mediumMachineAvgTime.toFixed(2)}ms`);
    console.log(`Large machines (>100 states): ${this._metrics.summary.largeMachineAvgTime.toFixed(2)}ms`);
    
    // Write detailed report to file
    this.writeReport();
  }
  
  /**
   * Extract state machine metrics from a test result
   */
  extractStateMachineMetrics(testResult) {
    // This implementation would depend on how metrics are stored in the test
    // For this example, we'll look for a global metrics object
    
    // Check if the test stored metrics in the global object
    if (global.__STATE_MACHINE_METRICS__) {
      const metrics = global.__STATE_MACHINE_METRICS__.getReport();
      global.__STATE_MACHINE_METRICS__.reset(); // Reset for next test
      
      // Extract operation times
      const minimizationOp = metrics.operations.find(op => op.name === 'minimizeStateMachine');
      const equivalenceClassOp = metrics.operations.find(op => op.name === 'computeEquivalenceClasses');
      const transitionOp = metrics.operations.find(op => op.name === 'optimizeTransitions');
      
      // Try to extract state counts from the test name
      const stateCounts = testResult.title.match(/(\d+)\s+states?/i);
      const stateCount = stateCounts ? parseInt(stateCounts[1], 10) : 0;
      
      // Try to extract result counts
      const resultCounts = testResult.title.match(/reduced to (\d+)\s+states?/i);
      const resultCount = resultCounts ? parseInt(resultCounts[1], 10) : 0;
      
      const stateReductionRatio = stateCount > 0 && resultCount > 0 
        ? (stateCount - resultCount) / stateCount 
        : 0;
      
      return {
        testTitle: testResult.title,
        stateCount,
        resultCount,
        stateReductionRatio,
        minimizationTime: minimizationOp?.duration || 0,
        equivalenceClassTime: equivalenceClassOp?.duration || 0,
        transitionTime: transitionOp?.duration || 0,
        totalTime: metrics.totalDuration
      };
    }
    
    return null;
  }
  
  /**
   * Update a running average in the summary metrics
   */
  updateAverage(metricName, newValue) {
    const currentCount = this._metrics.stateMachineMetricsCount || 0;
    const currentAvg = this._metrics.summary[metricName] || 0;
    
    if (currentCount === 0) {
      this._metrics.summary[metricName] = newValue;
    } else {
      // Update running average
      this._metrics.summary[metricName] = 
        (currentAvg * currentCount + newValue) / (currentCount + 1);
    }
    
    this._metrics.stateMachineMetricsCount = currentCount + 1;
  }
  
  /**
   * Write the detailed performance report to a file
   */
  writeReport() {
    const reportsDir = path.resolve(process.cwd(), 'reports', 'performance');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
    const reportPath = path.join(reportsDir, `state-machine-performance-${timestamp}.json`);
    
    fs.writeFileSync(
      reportPath,
      JSON.stringify(this._metrics, null, 2)
    );
    
    console.log(`\nDetailed report written to: ${reportPath}`);
  }
}

module.exports = StateMachinePerformanceReporter;