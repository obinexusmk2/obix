/**
 * src/cli/analyzer/index.ts
 * 
 * Entry point for analyzer CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { AnalyzeCommand } from './commands/analyze';
import { MetricsCommand } from './commands/metrics';

/**
 * Register analyzer commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerAnalyzerCommands(registry: CommandRegistry): void {
  registry.registerCommand('analyzer:analyze', new AnalyzeCommand());
  registry.registerCommand('analyzer:metrics', new MetricsCommand());
}

/**
 * Create a analyzer command group
 * 
 * @param container Service container
 * @returns Command instance for analyzer commands
 */
export function createAnalyzerCommand(container: ServiceContainer): Command {
  const analyzerCommand = new Command('analyzer')
    .description('Analyzer operations');
  
  // Register commands with the analyzer command
  const registry = new CommandRegistry(container);
  registerAnalyzerCommands(registry);
  
  // Register all commands with the analyzer command
  registry.registerAllCommands(analyzerCommand);
  
  return analyzerCommand;
}
