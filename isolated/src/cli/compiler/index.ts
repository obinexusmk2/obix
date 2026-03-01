/**
 * src/cli/compiler/index.ts
 * 
 * Entry point for compiler CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { CompileCommandCommand } from './commands/CompileCommand';
import { CompileCommand } from './commands/compile';
import { WatchCommand } from './commands/watch';

/**
 * Register compiler commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerCompilerCommands(registry: CommandRegistry): void {
  registry.registerCommand('compiler:CompileCommand', new CompileCommandCommand());
  registry.registerCommand('compiler:compile', new CompileCommand());
  registry.registerCommand('compiler:watch', new WatchCommand());
}

/**
 * Create a compiler command group
 * 
 * @param container Service container
 * @returns Command instance for compiler commands
 */
export function createCompilerCommand(container: ServiceContainer): Command {
  const compilerCommand = new Command('compiler')
    .description('Compiler operations');
  
  // Register commands with the compiler command
  const registry = new CommandRegistry(container);
  registerCompilerCommands(registry);
  
  // Register all commands with the compiler command
  registry.registerAllCommands(compilerCommand);
  
  return compilerCommand;
}
