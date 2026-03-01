/**
 * Jest Unit Test Configuration
 * 
 * Specialized configuration for unit testing the OBIX framework
 * with focus on the DOP pattern, state minimization algorithms,
 * and AST optimization.
 */

import baseConfig from './jest.config.js';

/** @type {import('jest').Config} */
const unitConfig = {
  ...baseConfig,
  // Override base configuration for unit tests
  displayName: 'OBIX-Unit',
  
  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@core/dop/(.*)$": "<rootDir>/src/core/dop/$1",
    "^@test/(.*)$": "<rootDir>/tests/$1"
  },
  
  // Limit to unit tests directory
  roots: ['<rootDir>/tests/unit'],
  
  // Test pattern matching specifically for unit tests
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.spec.ts'
  ],
  
  // Absolute module import paths
  modulePaths: ['<rootDir>'],
  
  // Coverage specifically for unit tests
  coverageDirectory: '<rootDir>/tests/results/unit/coverage',
  
  // Unit test reporting
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/tests/results/unit',
      outputName: 'unit-results.xml'
    }]
  ],
  
  // Reduced timeout for unit tests
  testTimeout: 10000,
  
  // Create test groups for easier parallel execution
  testSequencer: '<rootDir>/tests/utils/unitTestSequencer.cjs',
  
  // Additional setup for unit tests only
  setupFilesAfterEnv: [
    '<rootDir>/tests/unit/setup.js'
  ],
  
  // Transform handlers
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json'
      },
    ],
  },
  
  // Force Jest to resolve modules from the project root
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignored paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Performance optimizations
  maxWorkers: '25%', // Reducing from base config for more focused execution
  
  // Cache configuration specific for unit tests
  cacheDirectory: '<rootDir>/node_modules/.cache/jest/unit',
  
  // Global variables
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true
    }
  },
  
  // Test environment configuration
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Detailed reporting for unit test failures
  verbose: true
};

export default unitConfig;
