{ pkgs ? import <nixpkgs> {} }:

let
  nodejs = pkgs.nodejs_18;
in

pkgs.mkShell {
  buildInputs = [
    nodejs
    pkgs.node2nix
    pkgs.yarn
    pkgs.jq
  ];

  shellHook = ''
    echo "ChuckNorris MCP Development Environment (nix-shell)"
    echo "Node Version: $(node -v)"
    echo ""
    echo "For a better experience, please use 'nix develop' instead."
    echo "This shell.nix is provided for backward compatibility."
    echo ""
    echo "Setup:"
    echo "  1. Run 'node2nix -l' to generate Nix expressions"
    echo "  2. Run 'nix-build' to build the package"
    echo "  3. Run 'nix-env -i ./result' to install"
    
    export CACHE_DIR="$HOME/.nix-chucknorris-cache"
    export LOG_DIR="/tmp/chucknorris-debug"
    
    mkdir -p "$CACHE_DIR"
    mkdir -p "$LOG_DIR"
    
    if [ ! -f .git/hooks/pre-commit ] && [ -d .git ]; then
      mkdir -p .git/hooks
      ln -sf ../../pre-commit.sh .git/hooks/pre-commit
      echo "Pre-commit hook installed."
    fi
  '';
} 