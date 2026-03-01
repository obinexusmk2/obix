#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the root directory
const rootDir = resolve(__dirname, '../..');
const packageJsonPath = resolve(rootDir, 'package.json');

// Read the current package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Ensure "type": "module" is present
if (packageJson.type !== 'module') {
  packageJson.type = 'module';
}

// Update script entries for babel and ESM compatibility
if (!packageJson.scripts.babel || !packageJson.scripts.babel.includes('babel')) {
  packageJson.scripts = {
    ...packageJson.scripts,
    "babel:build": "babel src --out-dir dist/babel --extensions \".ts,.tsx\" --config-file ./babel.config.js",
    "build:with-babel": "npm run babel:build && npm run build:ts"
  };
}

// Add Babel dependencies if not present
if (!packageJson.devDependencies || !packageJson.devDependencies['@babel/cli']) {
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@babel/cli": "^7.23.4",
    "@babel/core": "^7.23.5",
    "@babel/plugin-proposal-class-properties": "^7.18.6",
    "@babel/plugin-proposal-decorators": "^7.23.5",
    "@babel/plugin-transform-runtime": "^7.23.4",
    "@babel/preset-env": "^7.23.5",
    "@babel/preset-typescript": "^7.23.3",
    "babel-plugin-transform-typescript-metadata": "^0.3.2"
  };
}

if (!packageJson.dependencies || !packageJson.dependencies['@babel/runtime']) {
  packageJson.dependencies = {
    ...packageJson.dependencies,
    "@babel/runtime": "^7.23.5"
  };
}

// Add jest-environment-jsdom for react component testing if it's not already there
if (!packageJson.devDependencies || !packageJson.devDependencies['jest-environment-jsdom']) {
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "jest-environment-jsdom": "^29.7.0"
  };
}

// Write the updated package.json
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('Successfully updated package.json for ES Module compatibility');
