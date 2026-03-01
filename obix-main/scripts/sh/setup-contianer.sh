#!/bin/bash
# setup-container.sh
#
# This script sets up the IoC container for the OBIX framework and registers all services
# It's designed to be run during project initialization or when updating service registrations

set -e # Exit immediately if a command exits with a non-zero status

# Directory detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
CORE_DIR="$SRC_DIR/core"
CLI_DIR="$SRC_DIR/cli"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
log() {
  echo -e "${GREEN}[OBIX]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[OBIX WARNING]${NC} $1"
}

error() {
  echo -e "${RED}[OBIX ERROR]${NC} $1"
  exit 1
}

# Check for required directories
if [ ! -d "$SRC_DIR" ]; then
  error "Source directory not found at $SRC_DIR"
fi

if [ ! -d "$CORE_DIR" ]; then
  error "Core directory not found at $CORE_DIR"
fi

if [ ! -d "$CLI_DIR" ]; then
  warn "CLI directory not found at $CLI_DIR, creating it..."
  mkdir -p "$CLI_DIR"
fi

# Create IoC directory if it doesn't exist
IOC_DIR="$CORE_DIR/ioc"
if [ ! -d "$IOC_DIR" ]; then
  log "Creating IoC directory at $IOC_DIR"
  mkdir -p "$IOC_DIR"
fi

# Generate index file for IoC module
log "Generating index file for IoC module..."
cat > "$IOC_DIR/index.ts" << EOL
// Auto-generated index file for IoC module
export * from './ServiceContainer';
export * from './ServiceRegistry';
EOL

# Detect all command modules
log "Finding command modules..."
COMMAND_DIRS=$(find "$CLI_DIR" -type d -name "commands" | sort)
COMMAND_COUNT=0

# Generate command registry imports
COMMAND_IMPORTS=""
COMMAND_REGISTRATIONS=""

for CMD_DIR in $COMMAND_DIRS; do
  CATEGORY=$(basename "$(dirname "$CMD_DIR")")
  
  log "Processing command category: $CATEGORY"
  
  # Find all command modules
  COMMAND_FILES=$(find "$CMD_DIR" -name "*.ts" | sort)
  
  for CMD_FILE in $COMMAND_FILES; do
    CMD_NAME=$(basename "$CMD_FILE" .ts)
    
    # Avoid importing index files
    if [ "$CMD_NAME" == "index" ]; then
      continue
    fi
    
    # Create relative import path
    REL_PATH=$(realpath --relative-to="$CLI_DIR" "$CMD_FILE")
    REL_PATH="${REL_PATH%.ts}"
    
    # Add import statement
    COMMAND_IMPORTS+="import { create${CMD_NAME^} } from './$REL_PATH';\n"
    
    # Add registration statement
    COMMAND_REGISTRATIONS+="  registry.registerCommand('$CATEGORY.$CMD_NAME', create${CMD_NAME^});\n"
    
    COMMAND_COUNT=$((COMMAND_COUNT + 1))
  done
done

# Generate command registry setup file
log "Generating command registry setup file..."
cat > "$CLI_DIR/register-commands.ts" << EOL
// Auto-generated command registration file
import { CommandRegistry } from './CommandRegistry';
import { ServiceContainer } from '../core/ioc/ServiceContainer';
${COMMAND_IMPORTS}

/**
 * Register all CLI commands with the command registry
 * @param container Service container
 * @returns Command registry with all commands registered
 */
export function registerCommands(container: ServiceContainer): CommandRegistry {
  const registry = new CommandRegistry(container);
  
${COMMAND_REGISTRATIONS}
  return registry;
}
EOL

# Generate main CLI entry point if it doesn't exist
CLI_ENTRY="$CLI_DIR/index.ts"
if [ ! -f "$CLI_ENTRY" ]; then
  log "Generating CLI entry point..."
  cat > "$CLI_ENTRY" << EOL
// OBIX CLI entry point
import { Command } from 'commander';
import { ServiceRegistry } from '../core/ioc/ServiceRegistry';
import { registerCommands } from './register-commands';

/**
 * Initialize the CLI application
 */
export function initCLI(): void {
  // Create service container
  const container = ServiceRegistry.createContainer();
  
  // Register commands
  const commandRegistry = registerCommands(container);
  
  // Set up commander
  const program = new Command();
  program
    .name('obix')
    .description('OBIX Framework CLI')
    .version('1.0.0');
  
  // Register all commands
  const commands = commandRegistry.getAllCommands();
  for (const cmd of commands) {
    const commandProgram = program.command(cmd.metadata.name)
      .description(cmd.metadata.description)
      .action(async (...args) => {
        // Last argument is the command object from commander
        const commanderCmd = args[args.length - 1];
        const options = commanderCmd.opts();
        const cmdArgs = commanderCmd.args || [];
        
        try {
          await cmd.execute(cmdArgs, options);
        } catch (error) {
          console.error(\`Error executing command: \${error instanceof Error ? error.message : String(error)}\`);
          process.exit(1);
        }
      });
    
    // Register command-specific options
    if (typeof cmd.registerOptions === 'function') {
      cmd.registerOptions(commandProgram);
    }
    
    // Add alias if available
    if (cmd.metadata.alias) {
      commandProgram.alias(cmd.metadata.alias);
    }
  }
  
  // Parse command line arguments
  program.parse();
}

// Auto-execute if this is the main module
if (require.main === module) {
  initCLI();
}
EOL
fi

# Generate the main entry point for the CLI executable
BIN_DIR="$PROJECT_ROOT/bin"
if [ ! -d "$BIN_DIR" ]; then
  log "Creating bin directory at $BIN_DIR"
  mkdir -p "$BIN_DIR"
fi

# Create the CLI executable
CLI_EXECUTABLE="$BIN_DIR/obix"
log "Generating CLI executable at $CLI_EXECUTABLE"
cat > "$CLI_EXECUTABLE" << EOL
#!/usr/bin/env node

// OBIX CLI executable entry point
require('../dist/cli/index.js');
EOL

# Make it executable
chmod +x "$CLI_EXECUTABLE"

# Update package.json bin field
PACKAGE_JSON="$PROJECT_ROOT/package.json"
if [ -f "$PACKAGE_JSON" ]; then
  log "Updating package.json bin field..."
  # This is a simplified approach - in a real scenario, you'd use jq or a similar tool
  # to properly update the JSON without potentially breaking it
  tmp=$(mktemp)
  jq '.bin = {"obix": "./bin/obix"}' "$PACKAGE_JSON" > "$tmp" && mv "$tmp" "$PACKAGE_JSON"
fi

log "Found and registered $COMMAND_COUNT commands"
log "Setup complete! The IoC container is now configured."
log "Build the project with 'npm run build' and then run the CLI with './bin/obix'"