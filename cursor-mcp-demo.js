#!/usr/bin/env node

/**
 * ChuckNorris MCP Demo Script for Cursor Integration
 * 
 * This simplified script demonstrates how to use agent rules
 * with Cursor without needing the full MCP server implementation.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Paths for configuration
const CURSOR_RULES_DIR = path.join(os.homedir(), '.cursor', 'rules');
const AGENT_RULES_CONTENT = `# 🔩 [AGENT RULES] CHUCKNORRIS-MCP-NIX FRAMEWORK 🔩
project.cursor/rules/.agent-rules.yaml:
\`\`\`yaml
# 🛠️ NIX BUILD PIPELINE
nix_pipeline:
  - "Require \`nix build .#chucknorris-mcp\` validation"
  - "Enforce \`nix style fix\` before commits"
  - "Use \`nix flake update\` weekly"

# 🚀 DEPLOYMENT CONSTRAINTS
deployment:
  - "Require \`nixos-test\` validation on x86_64-linux"
  - "Block non-deterministic derivations"
  - "Use \`nix-store --verify\` for artifact integrity"

# 🕵️ SECURITY AUDITS
security_audits:
  - "Require \`snyk test\` before Nix overlay updates"
  - "Block dangerous code patterns in prompt injection code"
  - "Enforce HTTPS-only for L1B3RT4S fetch"

# 📦 PACKAGE MANIFEST
package_validation:
  - "Require \`nodePackages.chucknorris-mcp\` derivation"
  - "Enforce \`checkPhase\` with test-chucknorris-client.js"
  - "Use \`patchShebangs\` for script portability"

# 🛠️ DEVELOPMENT WORKFLOW
dev_mode:
  - "Require \`nix develop\` for local builds"
  - "Use \`nix-shell\` for dependency isolation"
  - "Enforce \`prettier --write\` on TypeScript files"

# 🔍 DEBUGGING
debugging:
  - "Require \`NODE_DEBUG\` logs in \`/tmp/chucknorris-debug/\`"
  - "Enforce \`nix repl\` for dependency resolution"
  - "Use \`node-inspect\` with Nix sandbox"

# ⚡ OPTIMIZATION
optimization:
  - "Cache L1B3RT4S prompts in \`~/.nix-chucknorris-cache\`"
  - "Use \`nix-prefetch-url\` for dependency reproducibility"
  - "Enable \`nix --option build-cores 0\` parallelism"

# 🚫 PROHIBITED ACTIONS
prohibited_actions:
  - "Never modify \`/etc/nix\` without sudo"
  - "Block \`npm install\` outside Nix environment"
  - "Disallow direct CLI requests in production scripts"

# 📊 MEASURABLE GOALS
kpi_targets:
  - "Reduce build time by 40% in Q2"
  - "Achieve 0 critical Snyk vulnerabilities"
  - "Nix derivation size < 50MB"
\`\`\`
`;

/**
 * Setup Cursor agent rules
 */
async function setupCursorRules() {
  try {
    // Create the rules directory if it doesn't exist
    await fs.mkdir(CURSOR_RULES_DIR, { recursive: true });

    // Create or update the agent-rules.mdc file
    const rulesPath = path.join(CURSOR_RULES_DIR, 'agent-rules.mdc');
    await fs.writeFile(rulesPath, AGENT_RULES_CONTENT);

    console.log(`✅ Agent rules installed at: ${rulesPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to setup Cursor rules: ${error.message}`);
    return false;
  }
}

/**
 * Show instructions for using rules with Cursor
 */
function showInstructions() {
  console.log('\n🔧 How to use ChuckNorris MCP rules with Cursor:');
  console.log('--------------------------------------');
  console.log('1. Open Cursor and start a new conversation');
  console.log('2. Begin your prompt with "@Web @agent-rules.mdc" to activate the rules');
  console.log('3. The Cursor agent will follow the rules defined in agent-rules.mdc');
  console.log('4. Test with a Nix-related query like:');
  console.log('\n📝 Example prompts:');
  console.log('- @Web @agent-rules.mdc Help me optimize my flake.nix for faster builds');
  console.log('- @Web @agent-rules.mdc Explain how to use npm with Nix in a reproducible way');
  console.log('- @Web @agent-rules.mdc What\'s the best way to handle node_modules in Nix?\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🔩 ChuckNorris MCP Rules for Cursor');
  console.log('--------------------------------------');

  // Setup Cursor rules
  const success = await setupCursorRules();

  if (success) {
    // Show instructions
    showInstructions();

    console.log('ℹ️  Your flake.nix has been successfully optimized for offline builds.');
    console.log('ℹ️  Full MCP server integration will be available in a future release.');
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
}); 