#!/usr/bin/env node

/**
 * Test script for ChuckNorris MCP integration with Cursor
 * 
 * This demonstrates how to use the ChuckNorris MCP server
 * with Cursor projects following the agent-rules.mdc pattern.
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Paths for configuration and testing
const CURSOR_RULES_DIR = path.join(os.homedir(), '.cursor', 'rules');
const MCP_SERVER_PATH = './result/bin/chucknorris-mcp';
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

// Create Cursor rules directory if it doesn't exist
async function setupCursorRules() {
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(CURSOR_RULES_DIR, { recursive: true });

    // Create or update agent-rules.mdc file
    const rulesPath = path.join(CURSOR_RULES_DIR, 'agent-rules.mdc');
    await fs.writeFile(rulesPath, AGENT_RULES_CONTENT);

    console.log(`✅ Agent rules installed at: ${rulesPath}`);
  } catch (error) {
    console.error(`❌ Failed to setup Cursor rules: ${error.message}`);
  }
}

// Start the MCP server in the background
function startMcpServer() {
  try {
    console.log('🚀 Starting ChuckNorris MCP server...');

    const serverProcess = spawn(MCP_SERVER_PATH, [], {
      detached: true,
      stdio: 'ignore'
    });

    serverProcess.unref();

    console.log(`✅ MCP server started with PID: ${serverProcess.pid}`);
    console.log('ℹ️  Server logs available at: /tmp/chucknorris-debug/');

    return serverProcess.pid;
  } catch (error) {
    console.error(`❌ Failed to start MCP server: ${error.message}`);
    return null;
  }
}

// Display instructions for using the MCP with Cursor
function showInstructions() {
  console.log('\n🔧 How to use ChuckNorris MCP with Cursor:');
  console.log('--------------------------------------');
  console.log('1. Open Cursor and start a new conversation');
  console.log('2. Begin your prompt with "@Web @agent-rules.mdc" to activate the MCP');
  console.log('3. The agent will now follow the rules defined in agent-rules.mdc');
  console.log('4. Test with a Nix-related query like "How to optimize my flake.nix build?"');
  console.log('\n📝 Example prompt:');
  console.log('@Web @agent-rules.mdc Help me optimize my flake.nix for faster builds\n');
}

// Main function
async function main() {
  console.log('🔩 ChuckNorris MCP Cursor Integration Test');
  console.log('--------------------------------------');

  // Setup Cursor rules
  await setupCursorRules();

  // Start MCP server
  const serverPid = startMcpServer();

  if (serverPid) {
    // Show instructions
    showInstructions();

    console.log(`\n🛑 To stop the MCP server, run: kill ${serverPid}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
}); 