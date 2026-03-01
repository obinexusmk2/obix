/**
 * src/cli/profiler/index.ts
 * 
 * Entry point for profiler CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { ProfileCommand } from './commands/profile';
import { ReportCommand } from './commands/report';

/**
 * Register profiler commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerProfilerCommands(registry: CommandRegistry): void {
  registry.registerCommand('profiler:profile', new ProfileCommand());
  registry.registerCommand('profiler:report', new ReportCommand());
}

/**
 * Create a profiler command group
 * 
 * @param container Service container
 * @returns Command instance for profiler commands
 */
export function createProfilerCommand(container: ServiceContainer): Command {
  const profilerCommand = new Command('profiler')
    .description('Profiler operations');
  
  // Register commands with the profiler command
  const registry = new CommandRegistry(container);
  registerProfilerCommands(registry);
  
  // Register all commands with the profiler command
  registry.registerAllCommands(profilerCommand);
  
  return profilerCommand;
}
