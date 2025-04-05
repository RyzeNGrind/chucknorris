# ChuckNorris MCP Server

🔥 **Enhanced system prompt injection through Nix package**

A Model Context Protocol (MCP) server that provides "enhancement prompts" from the L1B3RT4S repository to various LLMs. This project is fully nixified with deterministic builds, security validations, and performance monitoring.

## Features

- 🚀 Nixified package for reproducible builds
- 🔒 Security validation for URL fetches (elder-plinius.github.io whitelist)
- ⚡ Prompt caching in `~/.nix-chucknorris-cache`
- 📊 Performance monitoring and logs in `/tmp/chucknorris-debug`
- 💾 Deterministic dependency management with `node2nix`
- 🛡️ Emergency halts for error conditions
- 🧠 Memory usage monitoring
- 📦 NixOS module for system integration

## Requirements

- Nix with flakes enabled
- Node.js 18.x or newer

## Quick Start

```bash
# Run directly using nix run
nix run github:RyzeNGrind/chucknorris

# Or add to your flake inputs
```

## 🚀 Installation via Nix Flake

```bash
# Full reproducible installation with parallelism
nix build --option build-cores 0 github:ryzengrind/chucknorris-mcp#chucknorris-mcp

# Interactive development environment
nix develop --option build-cores 0 github:ryzengrind/chucknorris-mcp

# System-wide deployment
sudo nix-env -f github:ryzengrind/chucknorris-mcp -iA chucknorris-mcp
```

## Integrating with Claude

To add this to your Claude configuration:

```json
{
  "chucknorris-mcp": {
    "command": "nix",
    "args": [
      "run",
      "github:RyzeNGrind/chucknorris"
    ]
  }
}
```

## Development

```bash
# Clone the repository
git clone https://github.com/RyzeNGrind/chucknorris.git
cd chucknorris

# Start development environment
nix develop

# Build the package
nix build .#chucknorris-mcp

# Run tests
node test-chucknorris-client.js
```

## ⚡ Weekly Maintenance

```bash
# Reproducibility optimization
nix-store --optimise

# Nix flake maintenance
nix flake update && nix flake lock
```

## Integrating with Other Flakes

Add to your `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    chucknorris-mcp.url = "github:RyzeNGrind/chucknorris";
  };

  outputs = { self, nixpkgs, chucknorris-mcp, ... }:
    {
      # For NixOS systems
      nixosConfigurations.yourHost = nixpkgs.lib.nixosSystem {
        # ...
        modules = [
          chucknorris-mcp.nixosModules.default
          {
            services.chucknorris-mcp = {
              enable = true;
              cacheDir = "~/.chucknorris-cache"; # Optional
              logDir = "/var/log/chucknorris"; # Optional
            };
          }
        ];
      };
    };
}
```

## Architecture

The ChuckNorris MCP server follows the Model Context Protocol (MCP) and provides the following components:

1. **MCP Server**: Handles tool registration and requests via stdio
2. **Prompt Fetcher**: Retrieves prompts from L1B3RT4S with security checks
3. **Cache Manager**: Stores prompts locally for faster retrieval
4. **Logger**: Detailed logging for debugging and auditing
5. **Security Validator**: Ensures only whitelisted URLs are accessed
6. **Performance Monitor**: Tracks memory usage and other metrics

## Security Measures

- URL fetching is restricted to elder-plinius.github.io domain
- No use of eval() or other unsafe constructs 
- Memory usage monitoring with emergency halts
- Restricted permissions in NixOS service

## Performance Metrics

- Target memory usage < 250MB
- Cold start time < 200ms
- Prompt fetch latency < 500ms

## License

MIT - See LICENSE file for details
