// src/cli/CommandRegistry.ts

import { ServiceContainer, ServiceLifetime } from '../core/ioc/ServiceContainer';

/**
 * Interface for CLI command metadata
 */
export interface CommandMetadata {
  /**
   * Command name (used for command-line invocation)
   */
  name: string;
  
  /**
   * Command description
   */
  description: string;
  
  /**
   * Command alias (optional shorthand)
   */
  alias?: string;
  
  /**
   * Command category for grouping
   */
  category: string;
  
  /**
   * Whether this command requires a project context
   */
  requiresProject?: boolean;
}

/**
 * Interface for CLI command implementation
 */
export interface Command {
  /**
   * Command metadata
   */
  metadata: CommandMetadata;
  
  /**
   * Execute the command
   * @param args Command arguments
   * @param options Command options
   */
  execute(args: string[], options: Record<string, any>): Promise<void> | void;
  
  /**
   * Register command-specific options
   * @param program Commander program instance for option registration
   */
  registerOptions?(program: any): void;
}

/**
 * Factory function for creating command instances
 */
export type CommandFactory = (container: ServiceContainer) => Command;

/**
 * Registry for CLI commands using IoC pattern
 */
export class CommandRegistry {
  private container: ServiceContainer;
  
  /**
   * Create a new command registry
   * @param container IoC service container
   */
  constructor(container: ServiceContainer) {
    this.container = container;
  }
  
  /**
   * Register a CLI command
   * @param commandId Unique ID for the command
   * @param factory Factory function to create the command
   */
  public registerCommand(commandId: string, factory: CommandFactory): void {
    this.container.register(
      `cli.command.${commandId}`,
      (container) => factory(container),
      { 
        lifetime: ServiceLifetime.SINGLETON, 
        tags: ['cli', 'command'] 
      }
    );
  }
  
  /**
   * Get all registered commands
   * @returns Array of command instances
   */
  public getAllCommands(): Command[] {
    return this.container.getByTag<Command>('command');
  }
  
  /**
   * Get commands by category
   * @param category Category name
   * @returns Array of command instances in the specified category
   */
  public getCommandsByCategory(category: string): Command[] {
    return this.getAllCommands().filter(cmd => cmd.metadata.category === category);
  }
  
  /**
   * Get a command by name
   * @param name Command name
   * @returns Command instance or undefined if not found
   */
  public getCommandByName(name: string): Command | undefined {
    return this.getAllCommands().find(cmd => 
      cmd.metadata.name === name || cmd.metadata.alias === name
    );
  }
}

/**
 * Command categories
 */
export enum CommandCategory {
  BUNDLER = 'bundler',
  COMPILER = 'compiler',
  ANALYZER = 'analyzer',
  MINIFIER = 'minifier',
  POLICY = 'policy',
  PROFILER = 'profiler',
  CACHE = 'cache',
  UTILITY = 'utility'
}

/**
 * Abstract base class for CLI commands
 */
export abstract class BaseCommand implements Command {
  abstract metadata: CommandMetadata;
  
  constructor(protected container: ServiceContainer) {}
  
  abstract execute(args: string[], options: Record<string, any>): Promise<void> | void;
  
  /**
   * Register command options (default implementation)
   */
  registerOptions?(program: any): void {
    // Default implementation does nothing
  }
  
  /**
   * Get a formatted log message with the command name
   */
  protected formatLog(message: string): string {
    return `[${this.metadata.name}] ${message}`;
  }
  
  /**
   * Log a message
   */
  protected log(message: string): void {
    const logger = this.container.get<any>('logger');
    logger.log(this.formatLog(message));
  }
  
  /**
   * Log an error
   */
  protected error(message: string): void {
    const logger = this.container.get<any>('logger');
    logger.error(this.formatLog(message));
  }
  
  /**
   * Log a warning
   */
  protected warn(message: string): void {
    const logger = this.container.get<any>('logger');
    logger.warn(this.formatLog(message));
  }
}