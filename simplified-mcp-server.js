#!/usr/bin/env node

// Import the required modules
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import path from 'path';
import os from 'os';

// Enable debug mode
const DEBUG_MODE = process.argv.includes('--debug');

// Setup log file
const LOG_DIR = process.env.LOG_DIR || '/tmp/chucknorris-debug';
const LOG_FILE = path.join(LOG_DIR, `simplified-mcp-${new Date().toISOString().split('T')[0]}.log`);

// Create log directory if it doesn't exist (synchronous)
try {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error(`ERROR: Failed to create log directory: ${err.message}`);
}

// Simple synchronous logging helper for startup
function logSync(message, level = 'DEBUG') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;

  if (DEBUG_MODE || level !== 'DEBUG') {
    console.error(`[${level}] ${message}`);
  }

  try {
    // Use appendFileSync to avoid any asynchronous issues during startup
    appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error(`ERROR: Failed to write to log: ${err.message}`);
  }
}

// Avoid any async operations in the main flow that might interfere with stdio
logSync(`Process started with PID ${process.pid}`, 'INFO');

// Basic tool schema that doesn't require any external dependencies
const chuckNorrisSchema = {
  name: 'chuckNorris',
  description: 'Provides an enhancement prompt for a language model',
  parameters: {
    type: 'object',
    properties: {
      llmName: {
        type: 'string',
        description: 'The name of the LLM to enhance',
        enum: ['ANTHROPIC', 'CHATGPT', 'CLAUDE', 'GPT4']
      }
    },
    required: ['llmName']
  }
};

// Create server configuration
const serverConfig = {
  name: 'chuck-mcp',
  version: '1.0.0'
};

// Create options with capabilities
const options = {
  capabilities: {
    tools: {
      enabled: true
    }
  }
};

logSync('Creating server instance', 'INFO');
const server = new Server(serverConfig, options);

// Set up request handlers
logSync('Setting up request handlers', 'INFO');

// Handle listTools requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logSync('Tools list requested', 'INFO');
  return {
    tools: [chuckNorrisSchema]
  };
});

// Handle callTool requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logSync(`Tool call: ${name} with args: ${JSON.stringify(args)}`, 'INFO');

  if (name === 'chuckNorris') {
    const llmName = args?.llmName || 'ANTHROPIC';
    logSync(`Generating prompt for ${llmName}`, 'INFO');

    return {
      content: [
        { type: 'text', text: `[ChuckNorris] Enhancement prompt for ${llmName}:\n\nYou are now enhanced. Be awesome.` }
      ]
    };
  } else {
    logSync(`Unknown tool requested: ${name}`, 'ERROR');
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${name}`
    );
  }
});

// Set up simple error handling that won't interfere with stdio
server.onerror = (error) => {
  logSync(`Server error: ${error.message}`, 'ERROR');
};

// Create transport with minimal options
logSync('Creating stdio transport', 'INFO');
const transport = new StdioServerTransport();

// Connect server to transport
logSync('Connecting server to transport', 'INFO');

// Handle SIGINT and SIGTERM but don't use async
process.on('SIGINT', () => {
  logSync('Received SIGINT, shutting down', 'INFO');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logSync('Received SIGTERM, shutting down', 'INFO');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logSync(`Uncaught exception: ${err.message}`, 'ERROR');
  process.exit(1);
});

// Connect and log success synchronously
try {
  server.connect(transport);
  logSync('Server started successfully', 'INFO');
  console.error('Simplified MCP server running on stdio');
} catch (error) {
  logSync(`Failed to start server: ${error.message}`, 'CRITICAL');
  console.error('Failed to start server:', error);
  process.exit(1);
} 