#!/usr/bin/env node
// src/cli-main.ts

import { Command } from 'commander';
import { ServiceRegistry } from './core/ioc/registry/ServiceRegistry';
import { registerCommands } from './cli/register-commands';

/**
 * Initialize and run the OBIX CLI application
 * This is the main entry point for the CLI
 */
export function runCLI(): void {
  // Create service container with all core services
  const container = ServiceRegistry.createContainer();
  
  // Get the logger service
  const logger = container.get('logger');
  logger.log('Initializing OBIX CLI...');
  
  // Register all commands with the registry
  const commandRegistry = registerCommands(container);
  const commands = commandRegistry.getAllCommands();
  
  logger.log(`Registered ${commands.length} commands`);
  
  // Set up commander program
  const program = new Command();
  program
    .name('obix')
    .description('OBIX Framework - Web UI with automaton state minimization')
    .version('1.0.0'); // Would pull from package.json in real implementation
  
  // Add all commands from the registry
  for (const command of commands) {
    const { name, description, alias, category } = command.metadata;
    
    logger.debug(`Registering command: ${name} (${category})`);
    
    // Create command in program
    const commandProgram = program
      .command(name)
      .description(description)
      .action(async (...args) => {
        // Last argument is the Commander command object
        const commanderCmd = args[args.length - 1];
        const options = commanderCmd.opts();
        const cmdArgs = commanderCmd.args || [];
        
        try {
          logger.log(`Executing command: ${name}`);
          await command.execute(cmdArgs, options);
        } catch (error) {
          logger.error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }
      });
    
    // Add alias if provided
    if (alias) {
      commandProgram.alias(alias);
    }
    
    // Register command-specific options
    if (typeof command.registerOptions === 'function') {
      command.registerOptions(commandProgram);
    }
  }
  
  // Add global options
  program
    .option('-v, --verbose', 'Enable verbose output')
    .option('--no-color', 'Disable color output');
  
  // Handle global options
  program.hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    
    // Configure logger based on options
    if (options.verbose) {
      logger.log('Verbose mode enabled');
      // Would set logger to verbose mode in real implementation
    }
  });
  
  // Parse command line arguments and execute
  program.parse(process.argv);
  
  // If no command was specified, show help
  if (process.argv.length <= 2) {
    program.help();
  }
}

// Auto-execute if this is the main module
if (require.main === module) {
  runCLI();
}