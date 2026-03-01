
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts', '**/tests/unit/**/*.spec.ts'],
  transform: {
    '^.+\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@core/(.*)': '<rootDir>/src/core/$1',
    '@api/(.*)': '<rootDir>/src/api/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
