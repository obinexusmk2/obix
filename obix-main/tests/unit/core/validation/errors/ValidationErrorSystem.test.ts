/**
 * ValidationErrorSystem.test.ts
 * 
 * Comprehensive tests for the OBIX validation error system components.
 * Tests the core error classes, error handling, tracking, and execution tracing.
 */

import { ValidationError, ErrorSeverity, ValidationPhase } from '../../../src/core/validation/errors/ValidationError';
import { ParserError } from '../../../src/core/validation/errors/ParserError';
import { ValidationSystemError } from '../../../src/core/validation/errors/ValidationSystemError';
import { ExecutionTrace, TraceComparisonResult } from '../../../src/core/validation/errors/ExecutionTrace';
import { ErrorHandler } from '../../../src/core/validation/errors/ErrorHandler';
import { ValidationErrorTracker, MetricsEnabledErrorTracker } from '../../../src/core/validation/errors/ErrorTracker';
import { Position } from '../../../src/core/ast/html/node/HTMLNode';

describe('ValidationError', () => {
  test('creates a basic validation error', () => {
    const error = new ValidationError(
      'TEST_ERROR',
      'This is a test error',
      'test-component',
      'functional',
      ErrorSeverity.ERROR,
      { testKey: 'testValue' },
      ['trace1', 'trace2']
    );
    
    expect(error.errorCode).toBe('TEST_ERROR');
    expect(error.message).toBe('This is a test error');
    expect(error.component).toBe('test-component');
    expect(error.source).toBe('functional');
    expect(error.severity).toBe(ErrorSeverity.ERROR);
    expect(error.metadata).toHaveProperty('testKey', 'testValue');
    expect(error.trace).toEqual(['trace1', 'trace2']);
  });
  
  test('converts validation error to string', () => {
    const error = new ValidationError('TEST_ERROR', 'Test error', 'test-component');
    const errorString = error.toString();
    
    expect(errorString).toContain('TEST_ERROR');
    expect(errorString).toContain('Test error');
    expect(errorString).toContain('test-component');
  });
  
  test('adds trace to error', () => {
    const error = new ValidationError('TEST_ERROR', 'Test error', 'test-component');
    error.addTrace('new-trace-entry');
    
    expect(error.trace).toContain('new-trace-entry');
  });
  
  test('creates error with metadata', () => {
    const error = new ValidationError('TEST_ERROR', 'Test error', 'test-component');
    const enhancedError = error.withMetadata({ additionalInfo: 'some value' });
    
    expect(enhancedError.metadata).toHaveProperty('additionalInfo', 'some value');
    // Original error should be unchanged
    expect(error.metadata).not.toHaveProperty('additionalInfo');
  });
  
  test('serializes and deserializes error', () => {
    const original = new ValidationError(
      'TEST_ERROR',
      'Test error',
      'test-component',
      'functional',
      ErrorSeverity.ERROR,
      { testKey: 'testValue' }
    );
    
    const serialized = original.toJSON();
    const deserialized = ValidationError.fromObject(serialized);
    
    expect(deserialized.errorCode).toBe(original.errorCode);
    expect(deserialized.message).toBe(original.message);
    expect(deserialized.component).toBe(original.component);
    expect(deserialized.source).toBe(original.source);
    expect(deserialized.severity).toBe(original.severity);
    expect(deserialized.metadata).toHaveProperty('testKey', original.metadata.testKey);
  });
});

describe('ParserError', () => {
  test('creates a parser error with position information', () => {
    const position = new Position(10, 15, 120, 125);
    const error = new ParserError(
      'SYNTAX_ERROR',
      'Unexpected token',
      'css-parser',
      position,
      '.class { color: red; '
    );
    
    expect(error.errorCode).toBe('SYNTAX_ERROR');
    expect(error.position).toBe(position);
    expect(error.context).toBe('.class { color: red; ');
  });
  
  test('includes position in error string representation', () => {
    const position = new Position(10, 15, 120, 125);
    const error = new ParserError('SYNTAX_ERROR', 'Unexpected token', 'css-parser', position);
    const errorString = error.toString();
    
    expect(errorString).toContain('line 10, column 15');
  });
  
  test('serializes and deserializes parser error', () => {
    const position = new Position(10, 15, 120, 125);
    const original = new ParserError(
      'SYNTAX_ERROR', 
      'Unexpected token', 
      'css-parser', 
      position,
      '.class { color: red; '
    );
    
    const serialized = original.toJSON();
    const deserialized = ParserError.fromObject(serialized);
    
    expect(deserialized.errorCode).toBe(original.errorCode);
    expect(deserialized.position.line).toBe(original.position.line);
    expect(deserialized.position.column).toBe(original.position.column);
    expect(deserialized.context).toBe(original.context);
  });
});

describe('ValidationSystemError', () => {
  test('creates a system error with phase information', () => {
    const error = new ValidationSystemError(
      'VALIDATION_INIT_FAILED',
      'Failed to initialize validator',
      'validator-engine',
      ValidationPhase.INITIALIZATION,
      { initParams: { enableTracing: true } },
      'Error stack trace...',
      true,
      () => ({ fixed: true })
    );
    
    expect(error.errorCode).toBe('VALIDATION_INIT_FAILED');
    expect(error.phase).toBe(ValidationPhase.INITIALIZATION);
    expect(error.context).toHaveProperty('initParams');
    expect(error.recoverable).toBe(true);
  });
  
  test('can attempt recovery if recoverable', () => {
    const recoveryFn = jest.fn().mockReturnValue({ fixed: true });
    const error = new ValidationSystemError(
      'RECOVERABLE_ERROR',
      'This error can be recovered',
      'test-component',
      ValidationPhase.RULE_APPLICATION,
      {},
      '',
      true,
      recoveryFn
    );
    
    const result = error.recovery('param1', 'param2');
    
    expect(recoveryFn).toHaveBeenCalledWith('param1', 'param2');
    expect(result).toEqual({ fixed: true });
  });
  
  test('returns null from recovery if not recoverable', () => {
    const error = new ValidationSystemError(
      'NON_RECOVERABLE_ERROR',
      'This error cannot be recovered',
      'test-component',
      ValidationPhase.RULE_APPLICATION,
      {},
      '',
      false
    );
    
    const result = error.recovery();
    
    expect(result).toBeNull();
  });
});

describe('ExecutionTrace', () => {
  test('creates an execution trace for a rule', () => {
    const input = { value: 42, options: { validate: true } };
    const trace = ExecutionTrace.start('test-rule', input);
    
    expect(trace.ruleId).toBe('test-rule');
    expect(trace.inputSnapshot).toEqual(input);
  });
  
  test('records execution steps', () => {
    const trace = ExecutionTrace.start('test-rule');
    
    trace.addStep('initialized validator');
    trace.addStep('checking constraints');
    trace.addStep('validated successfully');
    
    expect(trace.executionPath).toHaveLength(3);
    expect(trace.executionPath[0]).toBe('initialized validator');
    expect(trace.executionPath[2]).toBe('validated successfully');
  });
  
  test('completes trace execution', () => {
    const trace = ExecutionTrace.start('test-rule');
    const output = { result: 'valid', score: 100 };
    
    trace.end(output);
    
    expect(trace.outputSnapshot).toEqual(output);
    expect(trace.getDuration()).toBeGreaterThanOrEqual(0);
  });
  
  test('compares traces with identical paths', () => {
    const trace1 = ExecutionTrace.start('test-rule');
    trace1.addStep('step1');
    trace1.addStep('step2');
    trace1.end({ result: 'valid' });
    
    const trace2 = ExecutionTrace.start('test-rule');
    trace2.addStep('step1');
    trace2.addStep('step2');
    trace2.end({ result: 'valid' });
    
    const result = trace1.compareWith(trace2);
    
    expect(result.equivalent).toBe(true);
    expect(result.divergencePoints).toHaveLength(0);
  });
  
  test('compares traces with different paths', () => {
    const trace1 = ExecutionTrace.start('test-rule');
    trace1.addStep('step1');
    trace1.addStep('step2');
    trace1.end({ result: 'valid' });
    
    const trace2 = ExecutionTrace.start('test-rule');
    trace2.addStep('step1');
    trace2.addStep('different-step');
    trace2.end({ result: 'valid' });
    
    const result = trace1.compareWith(trace2);
    
    expect(result.equivalent).toBe(false);
    expect(result.divergencePoints).toHaveLength(1);
    expect(result.divergencePoints[0]).toBe('path[1]');
  });
  
  test('compares traces with different outputs', () => {
    const trace1 = ExecutionTrace.start('test-rule');
    trace1.addStep('step1');
    trace1.end({ result: 'valid' });
    
    const trace2 = ExecutionTrace.start('test-rule');
    trace2.addStep('step1');
    trace2.end({ result: 'invalid' });
    
    const result = trace1.compareWith(trace2);
    
    expect(result.equivalent).toBe(false);
    expect(result.divergencePoints).toHaveLength(1);
    expect(result.divergencePoints[0]).toBe('output.result');
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    errorHandler = new ErrorHandler({
      enableSourceTracking: true,
      defaultComponent: 'test-component',
      maxErrorsPerComponent: 5,
      logToConsole: false
    });
  });
  
  test('handles basic validation errors', () => {
    const error = new ValidationError('TEST_ERROR', 'Test error', 'test-component');
    
    errorHandler.handleError(error);
    
    const errors = errorHandler.getErrorsByComponent().get('test-component');
    expect(errors).toBeDefined();
    expect(errors!.length).toBe(1);
    expect(errors![0].errorCode).toBe('TEST_ERROR');
  });
  
  test('tracks errors by source', () => {
    const functionalError = new ValidationError(
      'FUNC_ERROR', 
      'Functional error', 
      'test-component',
      'functional'
    );
    
    const oopError = new ValidationError(
      'OOP_ERROR', 
      'OOP error', 
      'test-component',
      'oop'
    );
    
    errorHandler.handleError(functionalError);
    errorHandler.handleError(oopError);
    
    const errorsBySource = errorHandler.getErrorsBySource();
    
    expect(errorsBySource.get('functional')?.length).toBe(1);
    expect(errorsBySource.get('oop')?.length).toBe(1);
  });
  
  test('filters errors by severity', () => {
    const infoError = new ValidationError(
      'INFO_ERROR', 
      'Info message', 
      'test-component',
      'functional',
      ErrorSeverity.INFO
    );
    
    const criticalError = new ValidationError(
      'CRITICAL_ERROR', 
      'Critical error', 
      'test-component',
      'functional',
      ErrorSeverity.CRITICAL
    );
    
    errorHandler.handleError(infoError);
    errorHandler.handleError(criticalError);
    
    const criticalErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.CRITICAL);
    const infoErrors = errorHandler.getErrorsBySeverity(ErrorSeverity.INFO);
    
    expect(criticalErrors.length).toBe(1);
    expect(criticalErrors[0].errorCode).toBe('CRITICAL_ERROR');
    expect(infoErrors.length).toBe(1);
    expect(infoErrors[0].errorCode).toBe('INFO_ERROR');
  });
  
  test('can clear all errors', () => {
    const error1 = new ValidationError('ERROR_1', 'Error 1', 'component-1');
    const error2 = new ValidationError('ERROR_2', 'Error 2', 'component-2');
    
    errorHandler.handleError(error1);
    errorHandler.handleError(error2);
    
    // Verify errors were added
    expect(errorHandler.getErrorsByComponent().get('component-1')?.length).toBe(1);
    expect(errorHandler.getErrorsByComponent().get('component-2')?.length).toBe(1);
    
    errorHandler.clearAllErrors();
    
    // Verify errors were cleared
    expect(errorHandler.getErrorsByComponent().get('component-1')?.length).toBe(0);
    expect(errorHandler.getErrorsByComponent().get('component-2')?.length).toBe(0);
    expect(errorHandler.getStats().totalErrors).toBe(0);
  });
  
  test('generates error summary', () => {
    const error1 = new ValidationError(
      'ERROR_1', 
      'Error 1', 
      'component-1', 
      'functional', 
      ErrorSeverity.ERROR
    );
    
    const error2 = new ValidationError(
      'ERROR_2', 
      'Warning message', 
      'component-1', 
      'oop', 
      ErrorSeverity.WARNING
    );
    
    errorHandler.handleError(error1);
    errorHandler.handleError(error2);
    
    const summary = errorHandler.generateSummary();
    
    expect(summary).toContain('Total errors: 2');
    expect(summary).toContain('component-1: 2');
    expect(summary).toContain('Functional implementation errors: 1');
    expect(summary).toContain('OOP implementation errors: 1');
  });
});

describe('ValidationErrorTracker', () => {
  test('tracks validation errors', () => {
    const tracker = new ValidationErrorTracker();
    const error = new ValidationError('TEST_ERROR', 'Test error', 'test-component');
    
    tracker.addError(error);
    
    expect(tracker.hasErrors()).toBe(true);
    expect(tracker.getErrors()).toHaveLength(1);
    expect(tracker.getErrors()[0].errorCode).toBe('TEST_ERROR');
  });
  
  test('counts errors by type', () => {
    const tracker = new ValidationErrorTracker();
    
    tracker.addError(new ValidationError('ERROR_1', 'Regular error', 'component'));
    tracker.addError(new ValidationError('ERROR_2', 'Another error', 'component'));
    tracker.addError(new ParserError('SYNTAX_ERROR', 'Parser error', 'parser', new Position()));
    
    const counts = tracker.getErrorTypeCounts();
    
    expect(counts.get('ValidationError')).toBe(2);
    expect(counts.get('ParserError')).toBe(1);
  });
  
  test('filters errors by component', () => {
    const tracker = new ValidationErrorTracker();
    
    tracker.addError(new ValidationError('ERROR_1', 'Error 1', 'component-1'));
    tracker.addError(new ValidationError('ERROR_2', 'Error 2', 'component-2'));
    tracker.addError(new ValidationError('ERROR_3', 'Error 3', 'component-1'));
    
    const component1Errors = tracker.filterByComponent('component-1');
    
    expect(component1Errors).toHaveLength(2);
    expect(component1Errors[0].errorCode).toBe('ERROR_1');
    expect(component1Errors[1].errorCode).toBe('ERROR_3');
  });
  
  test('groups errors by component', () => {
    const tracker = new ValidationErrorTracker();
    
    tracker.addError(new ValidationError('ERROR_1', 'Error 1', 'component-1'));
    tracker.addError(new ValidationError('ERROR_2', 'Error 2', 'component-2'));
    tracker.addError(new ValidationError('ERROR_3', 'Error 3', 'component-1'));
    
    const groupedErrors = tracker.groupByComponent();
    
    expect(groupedErrors.get('component-1')?.length).toBe(2);
    expect(groupedErrors.get('component-2')?.length).toBe(1);
  });
  
  test('generates summary of errors', () => {
    const tracker = new ValidationErrorTracker();
    
    tracker.addError(new ValidationError('ERROR_1', 'Error 1', 'component-1', 'functional', ErrorSeverity.ERROR));
    tracker.addError(new ValidationError('ERROR_2', 'Error 2', 'component-2', 'oop', ErrorSeverity.WARNING));
    
    const summary = tracker.generateSummary();
    
    expect(summary).toContain('Found 2 validation error(s)');
    expect(summary).toContain('component-1: 1');
    expect(summary).toContain('component-2: 1');
  });
});

describe('MetricsEnabledErrorTracker', () => {
  test('tracks error metrics', () => {
    const tracker = new MetricsEnabledErrorTracker();
    
    // Add errors with some delay to simulate time passing
    tracker.addError(new ValidationError('ERROR_1', 'Error 1', 'component-1'));
    
    // Wait a brief moment to ensure timestamp difference
    setTimeout(() => {
      tracker.addError(new ValidationError('ERROR_2', 'Error 2', 'component-2'));
      
      const timeSinceLastError = tracker.getTimeSinceLastError();
      expect(timeSinceLastError).toBeGreaterThanOrEqual(0);
      
      const errorRates = tracker.getErrorRates();
      expect(errorRates.size).toBeGreaterThan(0);
      
      const distribution = tracker.getErrorTypeDistribution();
      expect(distribution.get('ValidationError')).toBe(2);
      
      const summary = tracker.generateSummary();
      expect(summary).toContain('Error Metrics:');
      expect(summary).toContain('Time since last error:');
      expect(summary).toContain('ValidationError: 2 (100.0%)');
    }, 50);
  });
  
  test('serializes and deserializes with metrics', () => {
    const tracker = new MetricsEnabledErrorTracker();
    
    tracker.addError(new ValidationError('ERROR_1', 'Error 1', 'component-1'));
    tracker.addError(new ValidationError('ERROR_2', 'Error 2', 'component-2'));
    
    const serialized = tracker.toObject();
    const deserialized = MetricsEnabledErrorTracker.fromObject(serialized);
    
    expect(deserialized.getErrors().length).toBe(2);
    expect(deserialized.getErrorTypeDistribution().get('ValidationError')).toBe(2);
  });
});