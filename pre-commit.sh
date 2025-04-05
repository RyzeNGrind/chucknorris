#!/usr/bin/env bash
set -euo pipefail

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running ChuckNorris MCP pre-commit checks...${NC}"

# Check if nix is installed
if ! command -v nix &> /dev/null; then
    echo -e "${RED}Nix is not installed. Cannot proceed with pre-commit checks.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f1)
if [[ $MAJOR_VERSION -lt 18 ]]; then
    echo -e "${RED}Node.js version 18 or higher is required, but found $NODE_VERSION${NC}"
    exit 1
fi

# Check security - strict URL whitelist
echo -e "${YELLOW}Checking for non-whitelisted URLs...${NC}"
DISALLOWED_URLS=$(grep -r --include="*.js" -E 'https?://(?!(raw.githubusercontent.com|elder-plinius.github.io))' . || true)

if [[ -n "$DISALLOWED_URLS" ]]; then
    echo -e "${RED}Error: Found URLs that are not on the whitelist:${NC}"
    echo -e "$DISALLOWED_URLS"
    exit 1
fi

# Nix package validation
echo -e "${YELLOW}Validating Nix package...${NC}"

# Check flake syntax
echo -e "${YELLOW}Checking flake.nix syntax...${NC}"
nix flake check --no-build || {
    echo -e "${RED}Error: flake.nix contains errors${NC}"
    exit 1
}

# Validate versions are consistent
MCP_SDK_VERSION=$(grep -o '"@modelcontextprotocol/sdk": "[^"]*"' package.json | cut -d '"' -f 4)
NODE_FETCH_VERSION=$(grep -o '"node-fetch": "[^"]*"' package.json | cut -d '"' -f 4)

if [[ "$MCP_SDK_VERSION" != "^1.7.0" ]]; then
    echo -e "${RED}Error: @modelcontextprotocol/sdk version in package.json is not 1.7.0${NC}"
    exit 1
fi

if [[ "$NODE_FETCH_VERSION" != "^3.3.2" ]]; then
    echo -e "${RED}Error: node-fetch version in package.json is not 3.3.2${NC}"
    exit 1
fi

# Validate we don't use eval() in code
echo -e "${YELLOW}Checking for eval() calls...${NC}"
EVAL_USAGE=$(grep -r --include="*.js" -E '\beval\(' . || true)

if [[ -n "$EVAL_USAGE" ]]; then
    echo -e "${RED}Error: eval() usage detected:${NC}"
    echo -e "$EVAL_USAGE"
    exit 1
fi

# Check for direct curl usage
echo -e "${YELLOW}Checking for direct curl usage...${NC}"
CURL_USAGE=$(grep -r --include="*.js" -E '\bcurl\b' . || true)

if [[ -n "$CURL_USAGE" ]]; then
    echo -e "${RED}Error: curl usage detected:${NC}"
    echo -e "$CURL_USAGE"
    exit 1
fi

# Check for emergency halts
echo -e "${YELLOW}Validating emergency halt conditions...${NC}"
EMERGENCY_HALTS=$(grep -r --include="*.js" -E 'EMERGENCY HALT|process.exit\(1\)' . || true)

if [[ -z "$EMERGENCY_HALTS" ]]; then
    echo -e "${RED}Error: Missing emergency halt conditions${NC}"
    exit 1
fi

# Validate the cache directory configuration
echo -e "${YELLOW}Checking cache directory configuration...${NC}"
CACHE_DIR_CONFIG=$(grep -E 'CACHE_DIR.*\.nix-chucknorris-cache' chucknorris-mcp-server.js || true)

if [[ -z "$CACHE_DIR_CONFIG" ]]; then
    echo -e "${RED}Error: Cache directory not properly configured${NC}"
    exit 1
fi

# Validate debug logs
echo -e "${YELLOW}Checking debug log configuration...${NC}"
LOG_DIR_CONFIG=$(grep -E 'LOG_DIR.*chucknorris-debug' chucknorris-mcp-server.js || true)

if [[ -z "$LOG_DIR_CONFIG" ]]; then
    echo -e "${RED}Error: Log directory not properly configured${NC}"
    exit 1
fi

# Check for memory monitoring
echo -e "${YELLOW}Checking memory monitoring...${NC}"
MEMORY_MONITORING=$(grep -E 'memoryUsage|logMemoryUsage' chucknorris-mcp-server.js || true)

if [[ -z "$MEMORY_MONITORING" ]]; then
    echo -e "${RED}Error: Memory monitoring not implemented${NC}"
    exit 1
fi

echo -e "${GREEN}All pre-commit checks passed!${NC}"

# Run prettier to enforce code style
if command -v prettier &> /dev/null; then
    echo -e "${YELLOW}Running prettier...${NC}"
    prettier --write "*.js"
fi

exit 0 