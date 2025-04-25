#!/bin/bash

# Update Dependencies Check Script
# Runs the dependency checker and formats the output

# Set colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  AI Dev Agents Dependency Checker    ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""

# Ensure the reports directory exists
mkdir -p src/reports

# Make the TypeScript script executable if it isn't already
chmod +x src/scripts/update-deps.ts

# Run the update check script using ts-node
npx ts-node --project src/scripts/tsconfig.json src/scripts/update-deps.ts

echo ""
echo -e "${YELLOW}==============================================${NC}"
echo -e "${YELLOW}  To update all dependencies run:             ${NC}"
echo -e "${YELLOW}  npm update                                  ${NC}"
echo -e "${YELLOW}                                              ${NC}"
echo -e "${YELLOW}  To check for security vulnerabilities run:  ${NC}"
echo -e "${YELLOW}  npm audit                                   ${NC}"
echo -e "${YELLOW}==============================================${NC}" 