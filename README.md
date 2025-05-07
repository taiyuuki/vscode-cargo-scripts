<p align="center">
<img src="https://taiyuuki.gallerycdn.vsassets.io/extensions/taiyuuki/vscode-cargo-scripts/0.0.1/1680743890799/Microsoft.VisualStudio.Services.Icons.Default" width="150" />
</p>

<h1 align="center">Cargo Scripts for VS Code</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=taiyuuki.vscode-cargo-scripts">
    <img alt="Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/taiyuuki.vscode-cargo-scripts?color=%23813c85&label=Marketplace&logo=visual%20studio%20code">
  </a>
  <a href="https://github.com/taiyuuki/vscode-cargo-scripts/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg">
  </a>
</p>

A Visual Studio Code extension that helps Rust developers to run Cargo scripts directly from the sidebar.

Just like the scripts in NPM's `package.json`.

## ✨ Features

- 🚀 Auto-detect `.cargo/config.toml` and `Cargo.toml` configurations
- ⚡ One-click script execution (click in sidebar)
- 🔍 Auto-reload on config changes

## 🛠 Installation

1. Open VS Code Extensions Marketplace
2. Search for `Cargo Scripts` or `taiyuuki.vscode-cargo-scripts`
3. Click Install
4. Reload the editor

Or install via command line:

```bash
code --install-extension taiyuuki.vscode-cargo-scripts
```

## 🚦 Usage

You can define your scripts in `.cargo/config.toml` or `Cargo.toml`.

### [alias] in `.cargo/config.toml` (Recommended)

Refer to [The Cargo Book](https://doc.rust-lang.org/cargo/reference/config.html#alias) for more details about the `[alias]` section.

For example:

```toml
[alias]
r  = "run --release"
b = "build --release"
t = ["test", "--", "--nocapture"]
```

Then you will find the CARGO SCRIPTS on the sidebar, Notice how all scripts have a Run icon next to them, you can run script by clicking on the icon.

### `Cargo.toml`

Adding a [package.metadata.scripts] or [workspace.metadata.scripts] (If you are in a workspace) section to the Cargo.toml.

Noticing that the value should be a full command line string, do not omit the prefix like `cargo`.

For example:

```toml
[package.metadata.scripts]
run = "cargo run"
build = "cargo build --release"
test = "cargo test -- --nocapture"

# or if you are using a workspace
[workspace.metadata.scripts]
run = "cargo run"
build = "cargo build --release"
test = "cargo test -- --nocapture"
```
