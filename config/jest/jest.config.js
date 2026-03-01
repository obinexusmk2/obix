// config/jest/jest.config.js
const path = require('path');

/** @type {import('jest').Config} */
const config = {
  // Basic configuration
  rootDir: path.resolve(__dirname, '../..'),
  testEnvironment: 'node',
  preset: 'ts-jest',
  
  // Transform TypeScript using ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: path.resolve(__dirname, '../typescript/tsconfig.json'),
        diagnostics: {
          warnOnly: true
        }
      }
    ]
  },
  
  // File patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.history/'
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.types.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports/junit',
      outputName: 'jest-junit.xml',
      classNameTemplate: '{filepath}',
      titleTemplate: '{classname} > {title}'
    }]
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    path.resolve(__dirname, './jest.setup.js')
  ],
  
  // Global configuration
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  // Performance optimization for OBIX's automaton state minimization tests
  maxWorkers: '50%',
  maxConcurrency: 5,
  
  // Time for automaton state optimization tests which might take longer
  testTimeout: 30000,
  
  // Projects configuration for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 60000 // Longer timeout for performance tests
    }
  ],
  
  // Watch plugins for better TDD workflow
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects'
  ],
  
  // Error handling
  bail: 0, // Don't bail on first test failure
  verbose: true
};

module.exports = config;