/**
 * src/cli/minifier/index.ts
 * 
 * Entry point for minifier CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { MinifyCommand } from './commands/minify';
import { OptimizeCommand } from './commands/optimize';

/**
 * Register minifier commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerMinifierCommands(registry: CommandRegistry): void {
  registry.registerCommand('minifier:minify', new MinifyCommand());
  registry.registerCommand('minifier:optimize', new OptimizeCommand());
}

/**
 * Create a minifier command group
 * 
 * @param container Service container
 * @returns Command instance for minifier commands
 */
export function createMinifierCommand(container: ServiceContainer): Command {
  const minifierCommand = new Command('minifier')
    .description('Minifier operations');
  
  // Register commands with the minifier command
  const registry = new CommandRegistry(container);
  registerMinifierCommands(registry);
  
  // Register all commands with the minifier command
  registry.registerAllCommands(minifierCommand);
  
  return minifierCommand;
}
