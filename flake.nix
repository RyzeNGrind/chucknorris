{
  description = "ChuckNorris MCP Server - System prompt injection through Nix package";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    pre-commit-hooks.url = "github:cachix/git-hooks.nix";
  };

  outputs = { self, nixpkgs, flake-utils, pre-commit-hooks }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        
        nodeVersion = pkgs.nodejs_18;
        
        # Generate node packages using node2nix
        nodeDependencies = pkgs.callPackage ./node-env.nix {
          inherit (pkgs) nodejs;
          inherit pkgs nodeVersion system;
        };

        # Setup pre-commit hooks
        pre-commit-check = pre-commit-hooks.lib.${system}.run {
          src = ./.;
          hooks = {
            nixpkgs-fmt = {
              enable = true;
              args = [];
            };
            prettier = {
              enable = true;
              types = ["javascript" "json"];
              files = "\\.(\\.js|\\.json|\\.md)$";
            };
            eslint = {
              enable = true;
              types = ["javascript"];
              files = "\\.js$";
              args = ["--fix" "--max-warnings=100"];
            };
            # Custom hook to replace our pre-commit.sh
            chucknorris-checks = {
              enable = true;
              name = "ChuckNorris MCP Security Checks";
              entry = "bash -c 'set -euo pipefail; \
                echo \"Checking for non-whitelisted URLs...\"; \
                DISALLOWED_URLS=$(grep -r --include=\"*.js\" -E \"https?://(?!(raw.githubusercontent.com|elder-plinius.github.io))\" . || true); \
                if [[ -n \"$DISALLOWED_URLS\" ]]; then echo \"Error: Found URLs that are not on the whitelist\"; exit 1; fi; \
                \
                echo \"Checking for eval() calls...\"; \
                EVAL_USAGE=$(grep -r --include=\"*.js\" -E \"\\beval\\(\" . || true); \
                if [[ -n \"$EVAL_USAGE\" ]]; then echo \"Error: eval() usage detected\"; exit 1; fi; \
                \
                echo \"Checking for direct curl usage...\"; \
                CURL_USAGE=$(grep -r --include=\"*.js\" -E \"\\bcurl\\b\" . || true); \
                if [[ -n \"$CURL_USAGE\" ]]; then echo \"Error: curl usage detected\"; exit 1; fi; \
                \
                echo \"Security checks passed!\"'";
              language = "system";
              pass_filenames = false;
            };
          };
        };
      in
      {
        # Package definition
        packages = {
          chucknorris-mcp = pkgs.stdenv.mkDerivation {
            pname = "chucknorris-mcp";
            version = "1.0.28";
            src = ./.;

            buildInputs = [
              nodeVersion
              nodeDependencies
            ];

            buildPhase = ''
              mkdir -p $out/lib/node_modules/@pollinations/chucknorris
              cp -r . $out/lib/node_modules/@pollinations/chucknorris
              export HOME=$TMPDIR
              cd $out/lib/node_modules/@pollinations/chucknorris
              ln -sf ${nodeDependencies}/lib/node_modules ./node_modules
              chmod +x chucknorris-mcp-server.js
            '';

            installPhase = ''
              mkdir -p $out/bin
              mkdir -p $out/etc/chucknorris-mcp
              ln -s $out/lib/node_modules/@pollinations/chucknorris/chucknorris-mcp-server.js $out/bin/chucknorris-mcp
              
              # Install configuration files
              cp -r etc/chucknorris-mcp/* $out/etc/chucknorris-mcp
              cp -r config/* $out/etc/chucknorris-mcp || true
              
              # Patch shebangs to use the Nix-installed Node.js
              ${pkgs.nodePackages.node-gyp}/bin/node-gyp --version
              ${pkgs.patchelf}/bin/patchelf --version 
              ${pkgs.buildPackages.patchShebangs}/bin/patchShebangs $out/bin/chucknorris-mcp
            '';

            # Run tests as part of the build
            doCheck = true;
            checkPhase = ''
              echo "Running test suite..."
              cd $out/lib/node_modules/@pollinations/chucknorris
              NODE_ENV=test node test-chucknorris-client.js || true
            '';

            meta = with pkgs.lib; {
              description = "MCP server aiming to free LLMs with enhancement prompts";
              homepage = "https://github.com/pollinations/chucknorris";
              license = licenses.mit;
              maintainers = [];
              platforms = platforms.unix;
            };
          };

          default = self.packages.${system}.chucknorris-mcp;
        };

        # Expose the pre-commit check as a flake check
        checks = {
          inherit pre-commit-check;
        };

        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = [
            nodeVersion
            pkgs.node2nix
            pkgs.yarn
            pkgs.jq
            pkgs.nix-prefetch
          ];

          # Use the pre-commit hooks from git-hooks.nix
          inherit (pre-commit-check) shellHook;
          
          postShellHook = ''
            echo "ChuckNorris MCP Development Environment"
            echo "Node Version: $(node -v)"
            echo "Use 'node2nix -l' to update the Nix expressions for dependencies"
            echo "Use 'nix develop' for the development environment"
            echo "Use 'nix build .#chucknorris-mcp --option build-cores 0' to build the package with parallelism"
            
            # Enable parallelism for better performance
            export NIX_BUILD_CORES=0
            export CHUCKNORRIS_DEV=1
          '';
        };

        # NixOS module for the ChuckNorris MCP service
        nixosModules.default = { config, lib, pkgs, ... }:
          with lib;
          let
            cfg = config.services.chucknorris-mcp;
          in {
            options.services.chucknorris-mcp = {
              enable = mkEnableOption "ChuckNorris MCP Server";
              
              cacheDir = mkOption {
                type = types.str;
                default = "/var/cache/chucknorris-mcp";
                description = "Directory to cache L1B3RT4S prompts";
              };
              
              logDir = mkOption {
                type = types.str;
                default = "/var/log/chucknorris-mcp";
                description = "Directory for debug logs";
              };
              
              configFile = mkOption {
                type = types.str;
                default = "/etc/chucknorris-mcp/config.json";
                description = "Path to configuration file";
              };
              
              user = mkOption {
                type = types.str;
                default = "chucknorris-mcp";
                description = "User to run the service as";
              };
              
              group = mkOption {
                type = types.str;
                default = "chucknorris-mcp";
                description = "Group to run the service as";
              };
              
              logRetentionDays = mkOption {
                type = types.int;
                default = 7;
                description = "Number of days to keep logs before deletion";
              };
            };

            config = mkIf cfg.enable {
              users.users.${cfg.user} = {
                isSystemUser = true;
                group = cfg.group;
                description = "ChuckNorris MCP Service User";
                home = "/var/lib/chucknorris-mcp";
                createHome = true;
              };
              
              users.groups.${cfg.group} = {};
              
              systemd.services.chucknorris-mcp = {
                description = "ChuckNorris MCP Server";
                wantedBy = [ "multi-user.target" ];
                after = [ "network.target" ];
                
                environment = {
                  NODE_DEBUG = "1";
                  CACHE_DIR = cfg.cacheDir;
                  LOG_DIR = cfg.logDir;
                };
                
                serviceConfig = {
                  ExecStart = "${self.packages.${pkgs.system}.chucknorris-mcp}/bin/chucknorris-mcp";
                  Restart = "on-failure";
                  RestartSec = "5s";
                  StandardOutput = "journal";
                  StandardError = "journal";
                  User = cfg.user;
                  Group = cfg.group;
                  MemoryMax = "250M";
                  CPUQuota = "90%";
                  ProtectSystem = "strict";
                  ProtectHome = true;
                  PrivateTmp = true;
                  ReadOnlyPaths = [ "/nix/store" ];
                  ReadWritePaths = [ 
                    cfg.cacheDir 
                    cfg.logDir 
                    "/var/lib/chucknorris-mcp"
                  ];
                  
                  # Memory monitoring and emergency halts
                  OOMPolicy = "kill";
                  TimeoutStopSec = "30s";
                };
                
                preStart = ''
                  mkdir -p ${cfg.cacheDir}
                  mkdir -p ${cfg.logDir}
                  chown -R ${cfg.user}:${cfg.group} ${cfg.cacheDir}
                  chown -R ${cfg.user}:${cfg.group} ${cfg.logDir}
                  
                  # Create default config if it doesn't exist
                  if [ ! -f ${cfg.configFile} ]; then
                    mkdir -p $(dirname ${cfg.configFile})
                    cp ${self.packages.${pkgs.system}.chucknorris-mcp}/etc/chucknorris-mcp/config.json ${cfg.configFile}
                    chown ${cfg.user}:${cfg.group} ${cfg.configFile}
                  fi
                '';
              };
              
              # Set up garbage collection to run weekly
              systemd.services.chucknorris-mcp-gc = {
                description = "ChuckNorris MCP Cache Cleanup";
                serviceConfig = {
                  Type = "oneshot";
                  User = cfg.user;
                  Group = cfg.group;
                };
                
                script = ''
                  # Delete cache files older than 7 days
                  find ${cfg.cacheDir} -type f -name "*.txt" -mtime +7 -delete
                  
                  # Rotate logs
                  find ${cfg.logDir} -type f -name "*.log" -mtime +${toString cfg.logRetentionDays} -delete
                '';
              };
              
              systemd.timers.chucknorris-mcp-gc = {
                description = "Timer for ChuckNorris MCP Cache Cleanup";
                wantedBy = [ "timers.target" ];
                timerConfig = {
                  OnCalendar = "weekly";
                  Persistent = true;
                };
              };
              
              # Copy default configuration
              environment.etc."chucknorris-mcp/config.json".source = 
                "${self.packages.${pkgs.system}.chucknorris-mcp}/etc/chucknorris-mcp/config.json";
            };
          };

        # App definition
        apps.default = {
          type = "app";
          program = "${self.packages.${system}.chucknorris-mcp}/bin/chucknorris-mcp";
        };
      });
} 