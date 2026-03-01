#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawnSync } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths
const rootDir = resolve(__dirname, '../../..');
const jestConfigPath = resolve(rootDir, 'jest.config.js');

// Parse command line arguments
const args = process.argv.slice(2);

// Add default configuration if not explicitly provided
const jestArgs = [
  '--config', jestConfigPath,
  '--rootDir', rootDir,
  ...args
];

// Run Jest with the specified arguments
const result = spawnSync('node', ['--experimental-vm-modules', 'node_modules/jest/bin/jest.js', ...jestArgs], {
  stdio: 'inherit',
  cwd: rootDir
});

// Exit with the same code as the Jest process
process.exit(result.status);
