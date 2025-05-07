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

一个Visual Studio Code扩展，帮助开发者通过侧边栏直接运行Cargo脚本，支持`.cargo/config.toml`和`Cargo.toml`配置文件。

就像NPM`package.json`中的`scripts`一样。

## ✨ 功能特性

- 🚀 自动解析`.cargo/config.toml` 或 `Cargo.toml` 配置
- ⚡ 一键运行脚本（侧边栏点击即可）
- 🔍 自动监听配置文件变化

## 🛠 安装

1. 打开VS Code扩展市场
2. 搜索 `Cargo Scripts` 或者 `taiyuuki.vscode-cargo-scripts`
3. 点击安装按钮
4. 重新加载编辑器

或直接运行：

```bash
code --install-extension taiyuuki.vscode-cargo-scripts
```

## 🚦 使用

你可以在`.cargo/config.toml`或`Cargo.toml`文件中定义脚本。

### `.cargo/config.toml`（推荐）

参考[The Cargo Book](https://doc.rust-lang.org/cargo/reference/config.html#alias)了解更多关于`[alias]`部分的内容。

例如：

```toml
[alias]
r  = "run --release"
b = "build --release"
t = ["test", "--", "--nocapture"]
```

然后你会在侧边栏看到CARGO SCRIPTS，注意所有脚本后面都有一个运行图标，你可以通过点击图标运行脚本。

### `Cargo.toml`

注意，脚本的值应该是完整的命令行字符串，不能省略前缀`cargo`。

例如：

```toml
[package.metadata.scripts]
run = "cargo run"
build = "cargo build --release"
test = "cargo test -- --nocapture"

# 或者，如果你在工作区中
[workspace.metadata.scripts]
run = "cargo run"
build = "cargo build --release"
test = "cargo test -- --nocapture"
```
