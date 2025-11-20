#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"

git config core.hooksPath "$root_dir/.githooks"

echo "Git hooks path set to .githooks. Pre-commit will run rustfmt and clippy."
