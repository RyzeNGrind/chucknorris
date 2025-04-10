#!/usr/bin/env node

// Ultra-minimal MCP server with debugging
const fs = require('fs');
const path = require('path');

// Setup debug logging to file
const DEBUG_DIR = '/tmp/chucknorris-debug';
const LOG_FILE = path.join(DEBUG_DIR, `ultra-mcp-${new Date().toISOString().split('T')[0]}.log`);

// Create debug directory if needed
try {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
} catch (err) {
  // Fall back to stderr if we can't create log dir
  process.stderr.write(`ERROR creating log dir: ${err.message}\n`);
}

// Enhanced logging function that writes to both stderr and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Write to stderr (visible in terminal)
  process.stderr.write(logMessage);

  // Also log to file if possible
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    process.stderr.write(`ERROR writing to log: ${err.message}\n`);
  }
}

// Log startup info
log(`Ultra-minimal MCP server starting`);
log(`Process ID: ${process.pid}`);
log(`Working directory: ${process.cwd()}`);
log(`Node version: ${process.version}`);
log(`Log file: ${LOG_FILE}`);

// Configure stdin/stdout for reliable communication
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

// Debugging helpers
log('Setting up stdin/stdout handlers');

// Flag to track if we've received any communication
let receivedCommunication = false;

// Handle mcp.info request - responds with bare minimum info
function handleInfo(id) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      name: 'ultra-basic-mcp',
      version: '1.0.0',
      capabilities: {
        tools: { enabled: true }
      }
    }
  };
}

// Handle mcp.listTools request
function handleListTools(id) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      tools: [
        {
          name: 'ping',
          description: 'Basic ping tool for testing',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }
  };
}

// Handle mcp.callTool request
function handleCallTool(id, params) {
  const toolName = params?.name || '';

  if (toolName === 'ping') {
    return {
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [
          {
            type: 'text',
            text: 'PONG! MCP Server is alive.'
          }
        ]
      }
    };
  } else {
    return {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: -32601,
        message: `Unknown tool: ${toolName}`
      }
    };
  }
}

// Very simple buffer management for stdin
let buffer = '';

// Handle incoming data
process.stdin.on('data', (chunk) => {
  log(`Received data chunk: ${chunk.length} bytes`);
  buffer += chunk;

  if (!receivedCommunication) {
    receivedCommunication = true;
    log('First communication received!');
  }

  // Process complete messages (separated by newlines)
  const messages = buffer.split('\n');
  buffer = messages.pop(); // Keep any incomplete message

  for (const message of messages) {
    if (message.trim() === '') continue;

    log(`Processing message: ${message}`);

    try {
      const request = JSON.parse(message);
      const id = request.id;
      const method = request.method;

      log(`Parsed request - Method: ${method}, ID: ${id}`);

      let response;

      // Simple method handling
      if (method === 'mcp.info') {
        response = handleInfo(id);
      } else if (method === 'mcp.listTools') {
        response = handleListTools(id);
      } else if (method === 'mcp.callTool') {
        response = handleCallTool(id, request.params);
      } else {
        // Default response for unknown methods
        response = {
          jsonrpc: '2.0',
          id: id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        };
      }

      // Send response
      const responseStr = JSON.stringify(response) + '\n';
      log(`Sending response: ${responseStr}`);
      process.stdout.write(responseStr);

    } catch (error) {
      log(`Error processing message: ${error.message}`);
      log(`Stack trace: ${error.stack}`);

      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${error.message}`
        }
      };

      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

// Handle process events
process.stdin.on('end', () => {
  log('stdin stream ended');
});

process.stdout.on('error', (err) => {
  log(`stdout error: ${err.message}`);
});

process.stdin.on('error', (err) => {
  log(`stdin error: ${err.message}`);
});

// Handle signals
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down');
  process.exit(0);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  log(`Stack trace: ${error.stack}`);
  // Keep running - don't exit
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled promise rejection: ${reason}`);
  // Keep running - don't exit
});

// Keep the process alive
setInterval(() => {
  const uptime = process.uptime();
  log(`Server uptime: ${uptime.toFixed(2)} seconds, received communication: ${receivedCommunication ? 'YES' : 'NO'}`);
}, 60000); // Log uptime every minute

log('Ultra-minimal MCP server initialized and ready'); 