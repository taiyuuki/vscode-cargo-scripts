<p align="center">
<img alt="Cargo Scripts" src="https://taiyuuki.gallerycdn.vsassets.io/extensions/taiyuuki/vscode-cargo-scripts/0.0.1/1680743890799/Microsoft.VisualStudio.Services.Icons.Default" width="150" />
</p>

<h1 align="center">Cargo Scripts for VS Code</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=taiyuuki.vscode-cargo-scripts">
    <img alt="Marketplace Version" src="https://img.shields.io/github/package-json/v/taiyuuki/vscode-cargo-scripts?label=Marketplace&color=%23813c85">
  </a>
  <a href="https://github.com/taiyuuki/vscode-cargo-scripts/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
  </a>
</p>

A Visual Studio Code extension that helps Rust developers run Cargo scripts directly from the sidebar - similar to npm scripts in `package.json`.

## ✨ Features

- 🚀 Auto-detects `.cargo/config.toml` and `Cargo.toml` configurations
- ⚡ One-click script execution via sidebar
- 🐛 Debug cargo scripts via [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb)
- 🔍 Auto-reload on config changes

## 🛠 Installation

1. Open VS Code Extensions Marketplace
2. Search for `Cargo Scripts` or `taiyuuki.vscode-cargo-scripts`
3. Click **Install**
4. Reload the editor

Or install via command line:

```bash
code --install-extension taiyuuki.vscode-cargo-scripts
```

## 🚦 Usage

Define your scripts in either `.cargo/config.toml` or `Cargo.toml`.

### `[alias]` in `.cargo/config.toml` (Recommended)

Refer to [The Cargo Book](https://doc.rust-lang.org/cargo/reference/config.html#alias) for details about the `[alias]` section.

Example configuration:

```toml
[alias]
r  = "run --release"
b = "build --release"
t = ["test", "--", "--nocapture"]
```

The scripts will appear in the `CARGO SCRIPTS` sidebar. Click the ▶️ icon next to any script to execute it.

## `Cargo.toml` Configuration

Add a `[package.metadata.scripts]` or `[workspace.metadata.scripts]` section (for workspace projects).

Important notes:

1. Commands must be full command-line strings (include cargo prefix)
2. Workspace configuration takes precedence over package configuration

Example:

```toml
[package.metadata.scripts]
run = "cargo run"
build = "cargo build --release"
test = "cargo test -- --nocapture"

# For workspace projects
[workspace.metadata.scripts]
lint = "cargo clippy --all-targets -- -D warnings"
```

## 🐛 Debugging

Click the debug icon next to any script in the sidebar (or the `Debug` CodeLens above the script definition) to start a debug session.

Requirements:

1. The script must be a `cargo` command that launches a target (`run`, `test`, `bench`, ...). Non-cargo commands and subcommands such as `check`, `clippy` or `watch` cannot be debugged.
2. The [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) extension must be installed — the debug actions are hidden until it is.

For `test` and `bench` scripts, targets are built with `--no-run` first, and the chosen test executable is launched directly — if several test targets exist, you will be asked which one to debug.

