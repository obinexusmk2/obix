#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the refactor scripts
const convertToESMScript = resolve(__dirname, 'convert-to-esm.js');
const updatePackageJsonScript = resolve(__dirname, 'update-package-json.js');
const updateBabelConfigScript = resolve(__dirname, 'update-babel-config.js');

// Run the scripts in sequence
console.log('=== OBIX Refactoring Process ===');

console.log('\n=== Step 1: Converting to ES Modules ===');
const esmResult = spawnSync('node', [convertToESMScript], { stdio: 'inherit' });
if (esmResult.status !== 0) {
  console.error('Error converting to ES Modules');
  process.exit(1);
}

console.log('\n=== Step 2: Updating package.json ===');
const packageResult = spawnSync('node', [updatePackageJsonScript], { stdio: 'inherit' });
if (packageResult.status !== 0) {
  console.error('Error updating package.json');
  process.exit(1);
}

console.log('\n=== Step 3: Updating Babel configuration ===');
const babelResult = spawnSync('node', [updateBabelConfigScript], { stdio: 'inherit' });
if (babelResult.status !== 0) {
  console.error('Error updating Babel configuration');
  process.exit(1);
}

console.log('\n=== Refactoring Complete! ===');
console.log('The project has been successfully refactored to implement the DOP adapter pattern.');
console.log('\nNext steps:');
console.log('1. Run tests: npm test');
console.log('2. Build with Babel: npm run babel:build');
console.log('3. Run the full build: npm run build:with-babel');
