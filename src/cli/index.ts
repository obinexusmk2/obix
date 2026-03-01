/**
 * src/cli/index.ts
 * 
 * Main entry point for the OBIX CLI
 * Sets up the IOC container and registers all commands
 */

import { Command } from 'commander';
import { createContainer } from '../core/ioc';
import { createPolicyCommand } from './policy';
import { createAnalyzerCommand } from './analyzer';
import { createBundlerCommand } from './bundler';
import { createCacheCommand } from './cache';
import { createCompilerCommand } from './compiler';
import { createMinifierCommand } from './minifier';
import { createProfilerCommand } from './profiler';

/**
 * Create and configure the CLI
 * 
 * @returns Configured CLI program
 */
export function createCLI(): Command {
  // Create IOC container
  const container = createContainer();
  
  // Create Commander program
  const program = new Command()
    .name('obix')
    .description('OBIX Framework CLI')
    .version('1.0.0');
  
  // Add module commands
  program.addCommand(createPolicyCommand(container));
  program.addCommand(createAnalyzerCommand(container));
  program.addCommand(createBundlerCommand(container));
  program.addCommand(createCacheCommand(container));
  program.addCommand(createCompilerCommand(container));
  program.addCommand(createMinifierCommand(container));
  program.addCommand(createProfilerCommand(container));
  
  return program;
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  const program = createCLI();
  program.parse(process.argv);
}
