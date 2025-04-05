# default.nix - Compatibility layer for non-flake nix users
(import (
  fetchTarball {
    url = "https://github.com/edolstra/flake-compat/archive/9a34fc3bad9edeb5f4be3754540d2c8675c4f8a8.tar.gz";
    sha256 = "sha256:1qc703yg0babixi6wshn5wm2kgl5y1drcswgszh4xxzbrwkk9xq7";
  }
) {
  src = ./.;
}).defaultNix 