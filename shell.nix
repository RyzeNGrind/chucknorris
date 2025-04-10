{ pkgs ? import <nixpkgs> { } }:

let
  nodejs = pkgs.nodejs_18;
in
pkgs.mkShell {
  buildInputs = [
    nodejs
    pkgs.jq
  ];

  shellHook = ''
    # Set up environment variables
    export CHUCKNORRIS_DEV=1
    export CACHE_DIR="$HOME/.nix-chucknorris-cache"
    export LOG_DIR="/tmp/chucknorris-debug"

    # Create a pre-commit hook
    mkdir -p .git/hooks
    cat > .git/hooks/pre-commit << 'EOF'
    #!/bin/sh
    set -e
    ./pre-commit.sh
    EOF
    chmod +x .git/hooks/pre-commit

    echo "ChuckNorris MCP Development Environment"
    echo "--------------------------------------"
    echo "Node.js: $(node -v)"
    echo "Cache directory: $CACHE_DIR"
    echo "Log directory: $LOG_DIR"
    echo "Pre-commit hook: $PWD/.git/hooks/pre-commit"

    # Create required directories
    mkdir -p "$CACHE_DIR"
    mkdir -p "$LOG_DIR"
  '';
} 
