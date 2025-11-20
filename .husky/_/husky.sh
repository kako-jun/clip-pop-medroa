#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init
  command_path="$(command -v husky)"
  husky_hook_name="$(basename "$0")"
  husky_config_path="$(dirname "$0")/.."

  if [ "$husky_hook_name" = "husky.sh" ]; then
    husky_hook_name=""
  fi

  if [ -f "$husky_config_path/husky.local.sh" ]; then
    . "$husky_config_path/husky.local.sh"
  fi

  if [ "$HUSKY" = "0" ]; then
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - HUSKY env variable is set to 0, skipping hook" >&2
    fi
    exit 0
  fi

  if [ -z "$husky_hook_name" ]; then
    echo "husky - can't detect hook name, skipping hook" >&2
    exit 0
  fi

  export husky_hook_name
  if [ "$HUSKY_DEBUG" = "1" ]; then
    echo "husky (debug) - running $husky_hook_name hook" >&2
  fi
fi
