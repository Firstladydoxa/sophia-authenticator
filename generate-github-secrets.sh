#!/bin/bash

# GitHub Secrets Generator for Sophia Authenticator CI/CD
# This script generates all the base64 values needed for GitHub Secrets

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   GitHub Actions CI/CD - Secrets Generator                ║"
echo "║   Sophia Authenticator                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required files exist
KEYSTORE_FILE="android/app/sophia-authenticator-release.keystore"
GOOGLE_SERVICES_FILE="google-services.json"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}❌ Error: Keystore file not found at $KEYSTORE_FILE${NC}"
    exit 1
fi

if [ ! -f "$GOOGLE_SERVICES_FILE" ]; then
    echo -e "${RED}❌ Error: google-services.json file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Copy each value below and add it to GitHub Secrets"
echo "  Settings → Secrets and variables → Actions → New secret"
echo "════════════════════════════════════════════════════════════"
echo ""

# Generate KEYSTORE_BASE64
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Secret Name:${NC} KEYSTORE_BASE64"
echo -e "${YELLOW}Description:${NC} Base64-encoded production keystore file"
echo ""
echo -e "${GREEN}Secret Value (copy this):${NC}"
echo "---START---"
base64 "$KEYSTORE_FILE" | tr -d '\n'
echo ""
echo "---END---"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Generate GOOGLE_SERVICES_JSON
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Secret Name:${NC} GOOGLE_SERVICES_JSON"
echo -e "${YELLOW}Description:${NC} Base64-encoded Firebase configuration file"
echo ""
echo -e "${GREEN}Secret Value (copy this):${NC}"
echo "---START---"
base64 "$GOOGLE_SERVICES_FILE" | tr -d '\n'
echo ""
echo "---END---"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Other secrets
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Secret Name:${NC} KEYSTORE_PASSWORD"
echo -e "${YELLOW}Description:${NC} Keystore password (store password)"
echo ""
echo -e "${GREEN}Secret Value:${NC} SophiaAuth2026!"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Secret Name:${NC} KEY_ALIAS"
echo -e "${YELLOW}Description:${NC} Signing key alias"
echo ""
echo -e "${GREEN}Secret Value:${NC} sophia-authenticator"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Secret Name:${NC} KEY_PASSWORD"
echo -e "${YELLOW}Description:${NC} Signing key password"
echo ""
echo -e "${GREEN}Secret Value:${NC} SophiaAuth2026!"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📋 SUMMARY: 5 Secrets to Configure"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  1. KEYSTORE_BASE64          - Generated above (long string)"
echo "  2. GOOGLE_SERVICES_JSON     - Generated above (long string)"
echo "  3. KEYSTORE_PASSWORD        - SophiaAuth2026!"
echo "  4. KEY_ALIAS                - sophia-authenticator"
echo "  5. KEY_PASSWORD             - SophiaAuth2026!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ All secrets generated successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Go to your GitHub repository"
echo "  2. Click Settings → Secrets and variables → Actions"
echo "  3. Add each secret above using 'New repository secret'"
echo "  4. Push a commit to trigger the first build"
echo ""
echo "For detailed setup instructions, see: GITHUB_ACTIONS_SETUP.md"
echo ""
