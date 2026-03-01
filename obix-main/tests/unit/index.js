#!/usr/bin/env node

/**
 * Unit test runner for OBIX framework
 * 
 * This script runs Jest with the unit test configuration
 * and handles command-line arguments and reporting.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Configuration
const projectRoot = path.resolve(__dirname, '../../..');
const configPath = path.join(projectRoot, 'jest.unit.config.js');
const resultsDir = path.join(projectRoot, 'test-results');

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const coverage = args.includes('--coverage');
const debug = args.includes('--debug');
const updateSnapshots = args.includes('-u') || args.includes('--updateSnapshot');
const verbose = args.includes('--verbose');
const testNamePattern = args.find(arg => arg.startsWith('--testNamePattern='));
const testPathPattern = args.find(arg => arg.startsWith('--testPathPattern='));
const testFile = args.find(arg => !arg.startsWith('-') && arg.includes('.test.'));

// Build Jest command
let command = `node --experimental-vm-modules node_modules/.bin/jest --config ${configPath}`;

// Add additional flags
if (watch) {
  command += ' --watch';
}

if (coverage) {
  command += ' --coverage';
}

if (updateSnapshots) {
  command += ' -u';
}

if (debug) {
  command += ' --detectOpenHandles --forceExit';
}

if (verbose) {
  command += ' --verbose';
}

if (testNamePattern) {
  command += ` ${testNamePattern}`;
}

if (testPathPattern) {
  command += ` ${testPathPattern}`;
}

if (testFile) {
  command += ` ${testFile}`;
}

// Add output for CI systems
command += ' --ci --json --outputFile=test-results/unit-test-results.json';

// Execute Jest
console.log(chalk.blue(`Running unit tests with command: ${command}`));
try {
  execSync(command, { stdio: 'inherit', cwd: projectRoot });
  console.log(chalk.green('✓ Tests completed successfully'));
} catch (error) {
  // Jest will return non-zero exit code if tests fail
  console.error(chalk.red('✗ Tests failed with code:'), error.status);
  process.exit(error.status);
}