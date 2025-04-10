#!/usr/bin/env node

const MCP_VERSION = '1.0.0';

// Minimal stdio handling
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

// Simple error logging that won't interfere with communication
function log(message) {
  process.stderr.write(`[LOG] ${message}\n`);
}

// Handle JSONRPC requests
function handleRequest(request) {
  try {
    // Parse the JSON request
    const parsedRequest = JSON.parse(request);

    // Basic method handling
    switch (parsedRequest.method) {
      case 'mcp.listTools':
        return {
          jsonrpc: '2.0',
          id: parsedRequest.id,
          result: {
            tools: [
              {
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
              }
            ]
          }
        };

      case 'mcp.callTool':
        const params = parsedRequest.params || {};
        const toolName = params.name;
        const args = params.arguments || {};

        if (toolName === 'chuckNorris') {
          const llmName = args.llmName || 'ANTHROPIC';
          return {
            jsonrpc: '2.0',
            id: parsedRequest.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `[ChuckNorris] Enhancement prompt for ${llmName}:\n\nYou are now enhanced. Be awesome.`
                }
              ]
            }
          };
        } else {
          return {
            jsonrpc: '2.0',
            id: parsedRequest.id,
            error: {
              code: -32601,
              message: `Unknown tool: ${toolName}`
            }
          };
        }

      case 'mcp.info':
        return {
          jsonrpc: '2.0',
          id: parsedRequest.id,
          result: {
            name: 'chucknorris-basic',
            version: MCP_VERSION,
            capabilities: {
              tools: {
                enabled: true
              }
            }
          }
        };

      default:
        return {
          jsonrpc: '2.0',
          id: parsedRequest.id,
          error: {
            code: -32601,
            message: `Method ${parsedRequest.method} not found`
          }
        };
    }
  } catch (error) {
    // Handle parse errors
    return {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${error.message}`
      }
    };
  }
}

// Input buffer handling
let buffer = '';

// Process incoming data
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  // Check for complete messages (look for newline terminators)
  const messages = buffer.split('\n');

  // Keep the last part if incomplete (no trailing newline)
  buffer = messages.pop();

  // Process complete messages
  for (const message of messages) {
    if (message.trim() === '') continue;

    try {
      const response = handleRequest(message);
      // Send response with newline terminator
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error) {
      log(`Error processing message: ${error.message}`);
      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down');
  process.exit(0);
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Log startup
log('Basic MCP server started');
log(`Process ID: ${process.pid}`); 