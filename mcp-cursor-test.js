#!/usr/bin/env node

/**
 * Test script for ChuckNorris MCP integration with Cursor
 * 
 * This demonstrates how to use the ChuckNorris MCP server
 * with Cursor projects following the agent-rules.mdc pattern.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths for configuration and testing
const PROJECT_ROOT = process.cwd();
const CURSOR_RULES_DIR = path.join(PROJECT_ROOT, '.cursor', 'rules');
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

/**
 * Setup Cursor rules for ChuckNorris MCP
 */
async function setupCursorRules() {
  try {
    // Ensure the directory exists
    try {
      await fs.promises.mkdir(path.dirname(CURSOR_RULES_DIR), { recursive: true });
      await fs.promises.mkdir(CURSOR_RULES_DIR, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Write the agent rules to the designated location
    const rulesPath = path.join(CURSOR_RULES_DIR, 'agent-rules.mdc');
    await fs.promises.writeFile(rulesPath, AGENT_RULES_CONTENT);
    console.log(`✅ Successfully installed project-specific agent rules to: ${rulesPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to setup Cursor rules:', error);
    return false;
  }
}

/**
 * Setup Cursor MCP server configuration
 */
async function setupCursorMcpServer() {
  try {
    // Ensure .cursor directory exists (parent of CURSOR_RULES_DIR)
    const cursorDir = path.dirname(CURSOR_RULES_DIR);
    try {
      await fs.promises.mkdir(cursorDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Create MCP server configuration
    const mcpServerConfig = {
      servers: [
        {
          name: 'chucknorris-mcp',
          command: '${PROJECT_PATH}/result/bin/chucknorris-mcp',
          enabled: true,
          env: {
            NODE_PATH: '${PROJECT_PATH}/node_modules',
            CACHE_DIR: '${HOME}/.nix-chucknorris-cache',
            LOG_DIR: '/tmp/chucknorris-debug'
          }
        }
      ]
    };

    // Write the configuration to .cursor/mcp-servers.json
    const mcpServersPath = path.join(cursorDir, 'mcp-servers.json');
    await fs.promises.writeFile(mcpServersPath, JSON.stringify(mcpServerConfig, null, 2));
    console.log(`✅ MCP server configuration installed at: ${mcpServersPath}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to setup MCP server configuration:', error);
    return false;
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

/**
 * Show instructions for using the MCP with Cursor
 */
function showInstructions() {
  console.log('\n🔧 How to use ChuckNorris MCP with Cursor:');
  console.log('--------------------------------------');
  console.log('1. Open this project in Cursor');
  console.log('2. Cursor will automatically detect the project-specific rules in .cursor/rules');
  console.log('3. It will also detect the project-specific MCP server in .cursor/mcp-servers.json');
  console.log('4. Begin your prompt with "@agent-rules.mdc" to activate the rules');
  console.log('5. The Cursor agent will follow the rules defined in .cursor/rules/agent-rules.mdc');
  console.log('\n📝 Example prompts:');
  console.log('- @agent-rules.mdc Help me optimize my flake.nix for faster builds');
  console.log('- @agent-rules.mdc Explain how to use npm with Nix in a reproducible way');
  console.log('- @agent-rules.mdc What\'s the best way to handle node_modules in Nix?\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Setting up ChuckNorris MCP for Cursor...');

  // Setup Cursor rules
  const rulesSetup = await setupCursorRules();

  // Setup MCP server configuration
  const mcpServerSetup = await setupCursorMcpServer();

  // Start MCP server for testing
  const serverPid = startMcpServer();

  // Show instructions if setup is successful
  if (rulesSetup && mcpServerSetup) {
    showInstructions();

    if (serverPid) {
      console.log(`\n🛑 To stop the MCP server, run: kill ${serverPid}`);
    }
  } else {
    console.log('❌ Setup incomplete. Please check the errors above.');
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
}); 