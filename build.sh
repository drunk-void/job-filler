#!/usr/bin/env bash

# AI Job Application Auto-Filler Build Script 🚀
# This script builds the extension for Chrome, Firefox, Edge, and Safari.

# Color codes for better visibility
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===> AI Job Auto-Filler Build Tool <===${NC}"

# Detect OS
IS_MACOS=false
if [[ "$OSTYPE" == "darwin"* ]]; then
    IS_MACOS=true
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo -e "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Build the project
echo -e "${BLUE}Building extension (Vite)...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Generic build successful! Output is in the 'dist' directory.${NC}"
    
    if [ "$IS_MACOS" = true ]; then
        echo -e "\n${BLUE}===> Safari Specifics (macOS Detected) <===${NC}"
        if [ -d "JobFillerSafari" ]; then
            echo -e "${GREEN}✔ Safari project found in 'JobFillerSafari'.${NC}"
            echo -e "To update the Safari extension with your latest changes, you can sync the 'dist' folder into your Xcode project."
        else
            echo -e "${YELLOW}Note: No 'JobFillerSafari' folder found.${NC}"
            echo -e "To create a Safari app wrapper, run:"
            echo -e "  ${BLUE}xcrun safari-web-extension-converter ./dist${NC}"
        fi
    fi

    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo -e "1. ${BLUE}Chrome/Brave/Edge/Arc:${NC} Go to extensions page, enable 'Developer mode', and 'Load unpacked' from the 'dist' folder."
    echo -e "2. ${BLUE}Safari:${NC} Open 'JobFillerSafari' in Xcode and click 'Run'."
    echo -e "3. ${BLUE}Package:${NC} Run './package.sh' to create distributable ZIP files."
else
    echo -e "${RED}✘ Build failed. Please check the error messages above.${NC}"
    exit 1
fi
