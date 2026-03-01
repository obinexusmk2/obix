// scripts/dev/setup/directories.js
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Project root directory
const ROOT_DIR = path.resolve(__dirname, '../../..');

// Define directories to create
const DIRECTORIES = [
  // Build scripts
  'scripts/build/compile',
  'scripts/build/analyze',
  
  // Test scripts
  'scripts/test/unit',
  'scripts/test/integration',
  'scripts/test/performance',
  
  // Configuration
  'config/typescript',
  'config/jest',
  'config/rollup',
  'config/eslint/base',
  
  // Automated tests
  'tests/unit/core/automaton',
  'tests/unit/core/ast',
  'tests/unit/api',
  'tests/integration',
  'tests/performance',
  'tests/fixtures',
  
  // Reports
  'reports/coverage',
  'reports/performance',
  'reports/junit',
  
  // Documentation
  'docs/api',
  'docs/examples',
  'docs/algorithms'
];

// Function to create directories
function createDirectories() {
  console.log(chalk.blue('Setting up OBIX project directory structure...'));
  
  let created = 0;
  let existing = 0;
  
  for (const dir of DIRECTORIES) {
    const fullPath = path.join(ROOT_DIR, dir);
    
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(chalk.green(`✓ Created: ${dir}`));
        created++;
      } catch (error) {
        console.error(chalk.red(`✗ Failed to create: ${dir}`));
        console.error(chalk.gray(`  ${error.message || String(error)}`));
      }
    } else {
      console.log(chalk.yellow(`• Exists: ${dir}`));
      existing++;
    }
  }
  
  console.log(chalk.blue(`\nDirectory setup complete.`));
  console.log(chalk.blue(`Created: ${created} directories`));
  console.log(chalk.blue(`Already existing: ${existing} directories`));
  console.log(chalk.blue(`Total: ${DIRECTORIES.length} directories`));
}

// Self-executing function
(function main() {
  createDirectories();
})();