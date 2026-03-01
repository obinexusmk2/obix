#!/bin/bash
# OBIX Environment Activation Script
# Source this script to activate the OBIX development environment
# Usage: source scripts/setup/activate.sh
# Copyright © 2025 OBINexus Computing - Computing from the Heart

# Store the current directory
export OBIX_PREV_DIR=$(pwd)

# Change to the project root directory (the directory containing this script)
cd "$(dirname "${BASH_SOURCE[0]}")/../.." || return

# Source the environment setup script
source "$(pwd)/scripts/setup/env-setup.sh"

# Add alias for quick access to OBIX dev workflow
alias obix="./scripts/setup/dev-workflow.sh"

# Define utility functions for development
obix_build() {
  npm run build "$@"
}

obix_test() {
  npm run test "$@"
}

obix_lint() {
  npm run lint "$@"
}

obix_docs() {
  npm run docs "$@"
}

obix_clean() {
  npm run clean "$@"
}

obix_status() {
  echo -e "${BLUE}OBIX Development Status${NC}"
  echo "------------------------"
  echo -e "Environment: ${GREEN}$NODE_ENV${NC}"
  echo -e "Version: ${GREEN}$OBIX_VERSION${NC}"
  if [ -d ".git" ]; then
    echo -e "Git Branch: ${GREEN}$(git rev-parse --abbrev-ref HEAD)${NC}"
    echo -e "Git Status: "
    git status -s
  fi
  echo ""
  echo -e "Recent changes:"
  if [ -d ".git" ]; then
    git log --pretty=format:"%h %s [%an]" -5
  fi
}

# Function to run a quick validation suite
obix_validate() {
  echo -e "${BLUE}Running OBIX validation suite...${NC}"
  npm run validate
}

# Function to deactivate the environment
obix_deactivate() {
  # Unset functions
  unset -f obix_build
  unset -f obix_test
  unset -f obix_lint
  unset -f obix_docs
  unset -f obix_clean
  unset -f obix_status
  unset -f obix_validate
  unset -f help
  
  # Remove aliases
  unalias obix 2>/dev/null || true
  
  # Unset environment variables
  unset NODE_ENV
  unset OBIX_ROOT
  unset OBIX_VERSION
  unset OBIX_ENABLE_JSX
  unset OBIX_ENABLE_VALIDATION
  unset OBIX_ENABLE_AUTO_OPTIMIZATION
  unset OBIX_ENABLE_FUNCTIONAL_INTERFACE
  unset OBIX_ENABLE_OOP_INTERFACE
  unset OBIX_ENABLE_STATE_MINIMIZATION
  unset OBIX_MAX_STATES
  unset OBIX_EQUIVALENCE_CLASS_BATCH_SIZE
  unset OBIX_ENABLE_STATE_CACHING
  unset OBIX_PARSER_STRICT_MODE
  unset OBIX_ENABLE_HTML_EXTENSIONS
  unset OBIX_DIFF_ALGORITHM
  unset OBIX_ENABLE_PATCH_BATCHING
  unset OBIX_ENABLE_RECONCILIATION_HINTS
  unset OBIX_BUILD_MODE
  unset OBIX_ENABLE_SOURCE_MAPS
  unset OBIX_MINIFY_OUTPUT
  unset OBIX_BUNDLE_SIZE_LIMIT
  unset OBIX_ENABLE_TREE_SHAKING
  unset BABEL_CACHE_PATH
  unset TS_NODE_PROJECT
  unset OBIX_BABEL_PLUGINS
  unset JEST_JUNIT_OUTPUT_DIR
  unset JEST_SONAR_REPORTER_OUTPUT_DIR
  unset JEST_COVERAGE_DIR
  unset TYPEDOC_OUTPUT_DIR
  unset OBIX_GIT_BRANCH
  unset OBIX_GIT_COMMIT
  unset OBIX_GIT_COMMIT_SHORT
  unset OBIX_GIT_LAST_TAG
  
  # Return to the previous directory
  cd "$OBIX_PREV_DIR" || return
  unset OBIX_PREV_DIR
  
  # Unset the deactivate function
  unset -f obix_deactivate
  
  echo "OBIX development environment deactivated"
}

# Export all the functions to make them available in the shell
export -f obix_build
export -f obix_test
export -f obix_lint
export -f obix_docs
export -f obix_clean
export -f obix_status
export -f obix_validate
export -f obix_deactivate

# Display activation message
echo ""
echo -e "${BLUE}OBIX development environment activated${NC}"
echo -e "Available commands:"
echo -e "  ${GREEN}obix${NC}              - Run development workflow commands"
echo -e "  ${GREEN}obix_build${NC}        - Build the project"
echo -e "  ${GREEN}obix_test${NC}         - Run tests"
echo -e "  ${GREEN}obix_lint${NC}         - Run linter"
echo -e "  ${GREEN}obix_docs${NC}         - Generate documentation"
echo -e "  ${GREEN}obix_clean${NC}        - Clean build artifacts"
echo -e "  ${GREEN}obix_status${NC}       - Show project status"
echo -e "  ${GREEN}obix_validate${NC}     - Run validation suite"
echo -e "  ${GREEN}help${NC}              - Show available npm commands"
echo -e "  ${GREEN}obix_deactivate${NC}   - Deactivate the environment"
echo ""
echo -e "${BLUE}Start developing with: ${GREEN}obix build${NC}"