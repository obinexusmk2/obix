/**
 * src/cli/test-module/commands/hello.ts
 * 
 * Sample command to test IoC integration
 */

import { Command } from "commander";
import { ServiceContainer } from "../../../core/ioc/ServiceContainer";
import { CommandHandler } from "../../command/CommandRegistry";

/**
 * Sample hello world command
 */
export class HelloCommand implements CommandHandler {
  /**
   * Register the command with Commander
   * 
   * @param program Commander program
   * @param container IoC service container
   */
  public register(program: Command, container: ServiceContainer): void {
    program
      .command("hello")
      .description("Say hello with IoC container integration")
      .option("-n, --name <name>", "Name to greet", "world")
      .action((options) => {
        this.execute(options, container);
      });
  }
  
  /**
   * Execute the command
   * 
   * @param options Command options
   * @param container IoC service container
   */
  private execute(options: { name: string }, container: ServiceContainer): void {
    try {
      // Try to get a logger service if available
      if (container.has("logger")) {
        const logger = container.resolve("logger");
        logger.log(`Hello, ${options.name}!`);
      } else {
        console.log(`Hello, ${options.name}!`);
      }
      
      // Display IoC container info
      console.log("\nIOC Container Services:");
      const services = container.getRegisteredServices?.() || [];
      services.forEach(service => {
        console.log(` - ${service}`);
      });
    } catch (error) {
      console.error("Error executing hello command:", error);
    }
  }
}

