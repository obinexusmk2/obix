/**
 * src/cli/test-module/index.ts
 * 
 * Test module for IoC integration in CLI
 */

import { Command } from "commander";
import { ServiceContainer } from "../../core/ioc/ServiceContainer";
import { CommandRegistry } from "../command/CommandRegistry";
import { HelloCommand } from "./commands/hello";

/**
 * Register test module commands with the registry
 * 
 * @param registry Command registry
 */
export function registerTestCommands(registry: CommandRegistry): void {
  registry.registerCommand("test:hello", new HelloCommand());
}

/**
 * Create a test module command group
 * 
 * @param container Service container
 * @returns Command instance for test commands
 */
export function createTestCommand(container: ServiceContainer): Command {
  const testCommand = new Command("test")
    .description("Test commands for IoC integration");
  
  // Register commands with the test command
  const registry = new CommandRegistry(container);
  registerTestCommands(registry);
  
  // Register all commands with the test command
  registry.registerAllCommands(testCommand);
  
  return testCommand;
}

