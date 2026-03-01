/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        warnOnly: true
      }
    }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@parser/(.*)$": "<rootDir>/src/core/parser/$1",
    "^@api/(.*)$": "<rootDir>/src/api/$1",
    "^@diff/(.*)$": "<rootDir>/src/core/diff/$1",
    "^@factory/(.*)$": "<rootDir>/src/core/factory/$1",
    "^@test/(.*)$": "<rootDir>/tests/$1"
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testSequencer: '<rootDir>/tests/OBIXTestSequencer.js',
  
  // Configure the test result processor
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'obix-test-results.xml'
    }]
  ],
  
  // Configure test coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/core/dop/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/core/automaton/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};

module.exports = config;