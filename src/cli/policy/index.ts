/**
 * src/cli/policy/index.ts
 * 
 * Entry point for policy CLI commands
 * Leverages IOC container for dependency injection
 */

import { Command } from 'commander';
import { ServiceContainer } from '../../core/ioc/containers/ServiceContainer';
import { CommandRegistry } from '../command/CommandRegistry';
import { CheckCommand } from './commands/check';
import { ListRulesCommand } from './commands/list-rules';
import { SetEnvironmentCommand } from './commands/set-environment';

/**
 * Register policy commands with the command registry
 * 
 * @param registry Command registry
 */
export function registerPolicyCommands(registry: CommandRegistry): void {
  registry.registerCommand('policy:check', new CheckCommand());
  registry.registerCommand('policy:list-rules', new ListRulesCommand());
  registry.registerCommand('policy:set-environment', new SetEnvironmentCommand());
}

/**
 * Create a policy command group
 * 
 * @param container Service container
 * @returns Command instance for policy commands
 */
export function createPolicyCommand(container: ServiceContainer): Command {
  const policyCommand = new Command('policy')
    .description('Policy operations');
  
  // Register commands with the policy command
  const registry = new CommandRegistry(container);
  registerPolicyCommands(registry);
  
  // Register all commands with the policy command
  registry.registerAllCommands(policyCommand);
  
  return policyCommand;
}
