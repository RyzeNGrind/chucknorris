#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const LOG_FILE = '/tmp/chucknorris-debug/test-client.log';

// Simple log function
async function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;

  console.log(entry.trim());

  try {
    await fs.appendFile(LOG_FILE, entry);
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

// Start MCP server
async function startServer() {
  await log('Starting MCP server test');

  const serverPath = path.join(process.cwd(), 'chucknorris-mcp-server.js');

  try {
    await fs.access(serverPath);
    await log(`Server script found at ${serverPath}`);
  } catch (err) {
    await log(`ERROR: Server script not found at ${serverPath}`);
    process.exit(1);
  }

  const server = spawn('node', [serverPath, '--debug'], {
    env: {
      ...process.env,
      NODE_PATH: path.join(process.cwd(), 'node_modules'),
      LOG_DIR: '/tmp/chucknorris-debug',
      NODE_DEBUG: 'mcp,net,http'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle server output
  server.stdout.on('data', async (data) => {
    const output = data.toString().trim();
    await log(`Server stdout: ${output}`);

    // Try to send a test command
    if (output.includes('running')) {
      await sendTestCommand(server);
    }
  });

  server.stderr.on('data', async (data) => {
    await log(`Server stderr: ${data.toString().trim()}`);
  });

  server.on('close', async (code) => {
    await log(`Server process exited with code ${code}`);
  });

  server.on('error', async (err) => {
    await log(`Server error: ${err.message}`);
  });

  return server;
}

// Send test command to server
async function sendTestCommand(server) {
  try {
    await log('Sending test command');

    // Format a simple ListTools request in JSON-RPC format
    const request = {
      jsonrpc: '2.0',
      id: 'test-1',
      method: 'mcp.listTools',
      params: {}
    };

    // Send request to server
    server.stdin.write(JSON.stringify(request) + '\n');
    await log('Test command sent');
  } catch (err) {
    await log(`Error sending test command: ${err.message}`);
  }
}

// Main function
async function main() {
  try {
    // Create log file
    await fs.writeFile(LOG_FILE, '');

    // Start server
    const server = await startServer();

    // Exit after 10 seconds
    setTimeout(async () => {
      await log('Test complete, shutting down');
      server.kill();
      process.exit(0);
    }, 10000);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

// Run the test
main(); 