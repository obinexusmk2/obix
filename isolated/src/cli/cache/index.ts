/**
 * src/cli/cache/index.ts
 * 
 * Entry point for cache CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { ClearCommand } from './commands/clear';
import { StatusCommand } from './commands/status';

/**
 * Register cache commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerCacheCommands(registry: CommandRegistry): void {
  registry.registerCommand('cache:clear', new ClearCommand());
  registry.registerCommand('cache:status', new StatusCommand());
}

/**
 * Create a cache command group
 * 
 * @param container Service container
 * @returns Command instance for cache commands
 */
export function createCacheCommand(container: ServiceContainer): Command {
  const cacheCommand = new Command('cache')
    .description('Cache operations');
  
  // Register commands with the cache command
  const registry = new CommandRegistry(container);
  registerCacheCommands(registry);
  
  // Register all commands with the cache command
  registry.registerAllCommands(cacheCommand);
  
  return cacheCommand;
}
