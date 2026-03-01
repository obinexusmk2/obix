#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths
const rootDir = resolve(__dirname, '../..');
const babelConfigPath = resolve(rootDir, 'babel.config.js');

// Check if babel.config.js exists
if (!existsSync(babelConfigPath)) {
  console.error('Error: babel.config.js not found in project root');
  process.exit(1);
}

// Read the current babel.config.js
let babelConfig = readFileSync(babelConfigPath, 'utf8');

// Check if the OBIX plugins section already exists
if (!babelConfig.includes('obix-plugins')) {
  // Create config directory if it doesn't exist
  const configDir = resolve(rootDir, 'config/babel');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Create OBIX plugins config if it doesn't exist
  const obixPluginsPath = resolve(configDir, 'obix-plugins.js');
  if (!existsSync(obixPluginsPath)) {
    writeFileSync(obixPluginsPath, `/**
 * OBIX Babel Plugin Configuration
 * 
 * This file configures the OBIX-specific Babel plugins that integrate
 * with the DOP adapter pattern and validation functionality.
 */

module.exports = function(api) {
  api.cache(true);
  
  // OBIX-specific plugins
  const obixPlugins = [
    // Add plugins as they are implemented
  ];
  
  // Feature flags for optional OBIX transformations
  const optionalPlugins = [];
  
  if (process.env.OBIX_ENABLE_VALIDATION) {
    // Add validation plugin when implemented
  }
  
  return {
    plugins: [...obixPlugins, ...optionalPlugins]
  };
};
`);
  }

  // Update the babel.config.js to include OBIX plugins
  const updatedConfig = babelConfig.replace(
    /module\.exports = function \(api\) {/,
    `module.exports = function (api) {
  // Load OBIX-specific plugins
  const obixPluginConfig = require('./config/babel/obix-plugins')(api);
  const obixPlugins = obixPluginConfig.plugins || [];
`
  ).replace(
    /return {/,
    `  // Environment-based features
  if (process.env.OBIX_ENABLE_JSX) {
    plugins.push("@babel/plugin-syntax-jsx");
  }

  return {`
  );

  // Replace plugins array to include obixPlugins
  const pluginsRegex = /plugins\s*:\s*\[([^\]]*)\]/s;
  const pluginsMatch = pluginsRegex.exec(updatedConfig);
  
  let finalConfig;
  if (pluginsMatch && pluginsMatch[1]) {
    // If plugins array exists, append obixPlugins to it
    finalConfig = updatedConfig.replace(
      pluginsRegex,
      `plugins: [${pluginsMatch[1]}, ...obixPlugins]`
    );
  } else {
    // If no plugins array found, just add it to return statement
    finalConfig = updatedConfig.replace(
      /return\s*{\s*/,
      `return {
    plugins: [...obixPlugins],
    `
    );
  }

  // Write the updated babel.config.js
  writeFileSync(babelConfigPath, finalConfig);
  console.log('Successfully updated babel.config.js to integrate OBIX plugins');
}