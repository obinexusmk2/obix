/**
 * src/cli/bundler/index.ts
 * 
 * Entry point for bundler CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { AnalyzeBundleCommand } from './commands/analyze-bundle';
import { BundleCommand } from './commands/bundle';

/**
 * Register bundler commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerBundlerCommands(registry: CommandRegistry): void {
  registry.registerCommand('bundler:analyze-bundle', new AnalyzeBundleCommand());
  registry.registerCommand('bundler:bundle', new BundleCommand());
}

/**
 * Create a bundler command group
 * 
 * @param container Service container
 * @returns Command instance for bundler commands
 */
export function createBundlerCommand(container: ServiceContainer): Command {
  const bundlerCommand = new Command('bundler')
    .description('Bundler operations');
  
  // Register commands with the bundler command
  const registry = new CommandRegistry(container);
  registerBundlerCommands(registry);
  
  // Register all commands with the bundler command
  registry.registerAllCommands(bundlerCommand);
  
  return bundlerCommand;
}
