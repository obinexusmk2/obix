#!/bin/bash
# Environment setup script for OBIX development
# Sets up environment variables and configurations for the OBIX framework
# Copyright © 2025 OBINexus Computing - Computing from the Heart

# ANSI color codes for output readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Display banner
echo -e "${CYAN}"
echo "  ██████╗ ██████╗ ██╗██╗  ██╗"
echo " ██╔═══██╗██╔══██╗██║╚██╗██╔╝"
echo " ██║   ██║██████╔╝██║ ╚███╔╝ "
echo " ██║   ██║██╔══██╗██║ ██╔██╗ "
echo " ╚██████╔╝██████╔╝██║██╔╝ ██╗"
echo "  ╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "${BLUE}Optimized Browser Interface eXperience${NC}"
echo -e "${MAGENTA}Computing from the Heart${NC}"
echo -e "${CYAN}Environment Setup${NC}"
echo ""

# Check for required tools
check_tool() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: $1 not found. Some features may not work properly.${NC}"
    return 1
  else
    return 0
  fi
}

check_tool "node" || true
check_tool "npm" || true
check_tool "git" || true
if ! command -v tsc &> /dev/null; then
  if command -v npx &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: Using npx tsc instead of global TypeScript installation${NC}"
  else
    echo -e "${YELLOW}⚠ Warning: Neither tsc nor npx found. TypeScript features may not work properly.${NC}"
  fi
else
  check_tool "tsc" || true
fi

# Base environment
export NODE_ENV=${NODE_ENV:-development}
export OBIX_ROOT=$(pwd)
export OBIX_VERSION=$(node -e "console.log(require('./package.json').version)")

# OBIX Specific Features
export OBIX_ENABLE_JSX=true
export OBIX_ENABLE_VALIDATION=true
export OBIX_ENABLE_AUTO_OPTIMIZATION=true

# DOP Adapter configuration
export OBIX_ENABLE_FUNCTIONAL_INTERFACE=true
export OBIX_ENABLE_OOP_INTERFACE=true
export OBIX_ENABLE_STATE_MINIMIZATION=true

# Automaton configuration
export OBIX_MAX_STATES=${OBIX_MAX_STATES:-10000}
export OBIX_EQUIVALENCE_CLASS_BATCH_SIZE=${OBIX_EQUIVALENCE_CLASS_BATCH_SIZE:-100}
export OBIX_ENABLE_STATE_CACHING=${OBIX_ENABLE_STATE_CACHING:-true}

# Parser configuration
export OBIX_PARSER_STRICT_MODE=${OBIX_PARSER_STRICT_MODE:-false}
export OBIX_ENABLE_HTML_EXTENSIONS=${OBIX_ENABLE_HTML_EXTENSIONS:-true}

# Diff engine configuration
export OBIX_DIFF_ALGORITHM=${OBIX_DIFF_ALGORITHM:-"optimized"}
export OBIX_ENABLE_PATCH_BATCHING=${OBIX_ENABLE_PATCH_BATCHING:-true}
export OBIX_ENABLE_RECONCILIATION_HINTS=${OBIX_ENABLE_RECONCILIATION_HINTS:-true}

# Build configuration
export OBIX_BUILD_MODE=${OBIX_BUILD_MODE:-"development"}
export OBIX_ENABLE_SOURCE_MAPS=${OBIX_ENABLE_SOURCE_MAPS:-true}
export OBIX_MINIFY_OUTPUT=${OBIX_MINIFY_OUTPUT:-false}
export OBIX_BUNDLE_SIZE_LIMIT=${OBIX_BUNDLE_SIZE_LIMIT:-"250kb"}
export OBIX_ENABLE_TREE_SHAKING=${OBIX_ENABLE_TREE_SHAKING:-true}

# Transpiler configuration
export BABEL_CACHE_PATH=./node_modules/.cache/babel-loader
export TS_NODE_PROJECT=tsconfig.json
export OBIX_BABEL_PLUGINS=(
  @babel/plugin-proposal-decorators
  @babel/plugin-proposal-class-properties
  @babel/plugin-transform-runtime
)

if [ "$OBIX_ENABLE_JSX" = true ]; then
  export OBIX_BABEL_PLUGINS+=(@babel/plugin-syntax-jsx)
fi

# Testing configuration
export JEST_JUNIT_OUTPUT_DIR=./reports/junit
export JEST_SONAR_REPORTER_OUTPUT_DIR=./reports/sonar
export JEST_COVERAGE_DIR=./coverage

# Documentation configuration
export TYPEDOC_OUTPUT_DIR=./docs/generated

# Path adjustments
export PATH="$OBIX_ROOT/node_modules/.bin:$PATH"

# Detect Git configuration
if [ -d "$OBIX_ROOT/.git" ]; then
  export OBIX_GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  export OBIX_GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  export OBIX_GIT_COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  export OBIX_GIT_LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
fi

# Create additional directories if needed
if [ ! -d "./reports" ]; then
  mkdir -p ./reports/junit
  mkdir -p ./reports/sonar
fi

# Function to list all available commands
list_commands() {
  echo -e "${BLUE}Available npm Commands:${NC}"
  echo -e "  ${CYAN}npm run build${NC}            - Build the project"
  echo -e "  ${CYAN}npm run build:dev${NC}        - Build the project in development mode"
  echo -e "  ${CYAN}npm run test${NC}             - Run unit tests"
  echo -e "  ${CYAN}npm run test:watch${NC}       - Run tests in watch mode"
  echo -e "  ${CYAN}npm run test:coverage${NC}    - Run tests with coverage"
  echo -e "  ${CYAN}npm run lint${NC}             - Run linter"
  echo -e "  ${CYAN}npm run lint:fix${NC}         - Run linter and fix issues"
  echo -e "  ${CYAN}npm run format${NC}           - Format code with prettier"
  echo -e "  ${CYAN}npm run docs${NC}             - Generate documentation"
  echo -e "  ${CYAN}npm run clean${NC}            - Clean build artifacts"
  echo -e "  ${CYAN}npm run dev${NC}              - Run development workflow"
  echo -e "  ${CYAN}npm run setup${NC}            - Run setup script"
  echo -e "  ${CYAN}npm run validate${NC}         - Run validation suite"
  echo ""
  echo -e "${BLUE}Development Workflow Commands:${NC}"
  echo -e "  ${CYAN}./scripts/setup/dev-workflow.sh${NC} [command]"
  echo -e "  Run './scripts/setup/dev-workflow.sh help' for more information"
}

# Output configuration summary
echo -e "${YELLOW}OBIX Environment Setup Complete${NC}"
echo "=============================="
echo -e "${GREEN}Development Environment:${NC}"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - OBIX_ROOT: $OBIX_ROOT"
echo "  - OBIX_VERSION: $OBIX_VERSION"
if [ -n "$OBIX_GIT_BRANCH" ]; then
  echo "  - Git Branch: $OBIX_GIT_BRANCH"
  echo "  - Git Commit: $OBIX_GIT_COMMIT_SHORT"
  if [ "$OBIX_GIT_LAST_TAG" != "none" ]; then
    echo "  - Last Tag: $OBIX_GIT_LAST_TAG"
  fi
fi
echo ""
echo -e "${GREEN}OBIX Features:${NC}"
echo "  - JSX Support: $OBIX_ENABLE_JSX"
echo "  - Validation: $OBIX_ENABLE_VALIDATION"
echo "  - Auto Optimization: $OBIX_ENABLE_AUTO_OPTIMIZATION"
echo ""
echo -e "${GREEN}Interface Configuration:${NC}"
echo "  - Functional Interface: $OBIX_ENABLE_FUNCTIONAL_INTERFACE"
echo "  - OOP Interface: $OBIX_ENABLE_OOP_INTERFACE"
echo "  - State Minimization: $OBIX_ENABLE_STATE_MINIMIZATION"
echo ""
echo -e "${GREEN}Build Configuration:${NC}"
echo "  - Build Mode: $OBIX_BUILD_MODE"
echo "  - Source Maps: $OBIX_ENABLE_SOURCE_MAPS"
echo "  - Minification: $OBIX_MINIFY_OUTPUT"
echo "  - Tree Shaking: $OBIX_ENABLE_TREE_SHAKING"
echo "  - Bundle Size Limit: $OBIX_BUNDLE_SIZE_LIMIT"
echo ""
echo -e "${BLUE}Ready to develop with OBIX!${NC}"
echo "Type 'help' to see available commands"

# Define a help function
help() {
  list_commands
}

# Export the function to make it available
export -f help