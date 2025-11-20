# Clip Pop Medroa (Tauri)

Clip Pop Medroa is a lightweight always-on-top clipboard overlay built with [Tauri](https://tauri.app/). It watches for clipboard updates, shows playful copy/clear banners, and lets users preconfigure the experience through a YAML file that lives in the operating system's standard settings directory.

## Features

- **Tauri overlay window** – frameless, transparent, and always on top so the toast never hides behind apps.
- **Copy / clear banners** – default dark or light translucent bars with localized "Copied" / "Cleared" strings and font icons.
- **Custom PNG/WebP support** – switch the theme to `custom` and point to per-event artwork (including animated transparent WebP) so the popup can become any character.
- **Hover-aware fade out** – popups fade away after the configured number of seconds and pause while hovered so the inline menu can be used.
- **︙ menu** – open the settings surface with a live preview or quit the resident process.
- **OS-native config file** – the app loads `config.yaml` once at startup from the platform's recommended path:
  - Linux/BSD: `$XDG_CONFIG_HOME/ClipPopMedroa/config.yaml` (falls back to `~/.config/...`)
  - macOS: `~/Library/Application Support/ClipPopMedroa/config.yaml`
  - Windows: `%APPDATA%\ClipPopMedroa\config.yaml`
- **YAML settings** – pick theme (`dark`, `light`, or `custom`), popup lifetime, corner, and custom image paths. Settings UI writes the file immediately; changes apply on the next launch per the original spec.
- **Locale dictionaries** – YAML dictionaries live under `config/locales` (user-provided) or the bundled `locales` folder. Missing keys fall back to English.

## Repository layout

```
config.example.yaml    # sample config values
src/                   # front-end HTML/CSS/JS for the overlay + settings
src-tauri/
  ├─ src/main.rs       # Tauri bootstrap + commands (config, locales, clipboard polling)
  ├─ resources/locales # built-in en/ja dictionaries shipped with the binary
  └─ tauri.conf.json   # window + bundler configuration
```

## Running the app

1. Install Rust (stable) and the Tauri system dependencies for your platform.
2. Build the Tauri shell:
   ```bash
 cd src-tauri
  cargo tauri dev
  ```
  Because the front-end uses plain HTML/CSS/JS (no bundler), the dev server simply loads `../src`.
3. Place a `config.yaml` in the OS-specific directory if you want to override the defaults. The included `config.example.yaml` is a good starting point.

## Development automation

- **Rust-only Git hooks** – run `./scripts/install-hooks.sh` once to point `core.hooksPath` at `.githooks`. The pre-commit hook runs `cargo fmt -- --check` and `cargo clippy --all-targets --all-features -- -D warnings` so commits stay clean without Node-based Husky.
- **CI linting** – `.github/workflows/ci.yml` runs the same `cargo fmt` + `cargo clippy` checks on pushes to `main`/`master` and on pull requests.
- **Tagged releases** – pushing a tag matching `v*` (or using `workflow_dispatch`) triggers `.github/workflows/release.yml`, which builds and attaches Tauri bundles to the GitHub release page. The workflow relies on the Rust toolchain and the static assets under `src/` (no JS tooling is required to bundle).

## Configuration reference

```yaml
theme: dark        # dark / light / custom
display_time: 3    # seconds (1-10 recommended)
corner: bottom_right  # top_left / top_right / bottom_left / bottom_right
custom_images:
  copy: ""        # absolute file path (PNG/WebP). Empty -> nothing is rendered
  clear: ""
```

## Locale dictionaries

Locale YAML files contain flat key/value pairs:

```yaml
copied: Copied to clipboard!
cleared: Clipboard cleared.
settings: Settings
...
```

User dictionaries can be dropped in the config directory under `locales/<lang>.yaml`. The app tries `navigator.language`, falls back to English, and exposes the messages to the UI.

## Screenshots / preview

The settings panel includes a live preview showing the currently selected corner, theme, and timing so you can fine-tune the look without waiting for an actual clipboard event.
