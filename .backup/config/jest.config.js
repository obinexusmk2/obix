/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        warnOnly: true
      }
    }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/",
    "^@core/(.*)$": "<rootDir>/src/core/",
    "^@parser/(.*)$": "<rootDir>/src/core/parser/",
    "^@api/(.*)$": "<rootDir>/src/api/",
    "^@diff/(.*)$": "<rootDir>/src/core/diff/",
    "^@factory/(.*)$": "<rootDir>/src/core/factory/",
    "^@test/(.*)$": "<rootDir>/tests/"
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
  testSequencer: '<rootDir>/tests/OBIXTestSequencer.js'
};

module.exports = config;
