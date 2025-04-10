#!/bin/bash

echo "Cleaning up MCP servers..."

# Kill any running simplified-mcp-server.js processes
echo "Killing simplified-mcp-server.js processes..."
pkill -f "simplified-mcp-server.js" || echo "No processes found"

# Kill any running chucknorris-mcp-server.js processes
echo "Killing chucknorris-mcp-server.js processes..."
pkill -f "chucknorris-mcp-server.js" || echo "No processes found"

# Clean up PID files
echo "Cleaning up PID files..."
rm -f /tmp/chucknorris-debug/simplified-mcp.pid

# Check if any processes are still running
echo "Checking for remaining processes..."
ps aux | grep -E "simplified-mcp-server.js|chucknorris-mcp-server.js" | grep -v grep

echo "Cleanup complete. Please restart Cursor to apply changes." 