<p align="center">
<img src="https://taiyuuki.gallerycdn.vsassets.io/extensions/taiyuuki/vscode-cargo-scripts/0.0.1/1680743890799/Microsoft.VisualStudio.Services.Icons.Default"  />
</p>

<h1 align="center">Cargo Scripts</h1>

<p align="center"><a href="https://marketplace.visualstudio.com/items?itemName=taiyuuki.vscode-cargo-scripts">
    <img alt="Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/taiyuuki.vscode-cargo-scripts?color=%23813c85&label=Marketplace&logo=visual%20studio%20code"></a></p>

`Cargo Scripts` 是一个VS Code插件，让你可以在 `Cargo.toml` 中配置命令，然后就能在侧边栏显示并点击运行。

就像NPM的 `package.json` 中的 `scripts` 字段一样。

## 使用

在 `Cargo.toml` 添加 `[package.metadata.scripts]`。

例如：

```toml
[package.metadata.scripts]
run = "cargo run"
check = "cargo check"
build = "cargo build"
release = "cargo build --release"
```

然后你就能在侧边栏中找到 **Cargo Scripts** 面板了，注意每个脚本后面都有一个 **运行** 图标，点击该图标即可运行脚本。

<p align="center">
<img src="https://s2.loli.net/2023/04/06/HwEItz9TR1Gcb7k.jpg" />
</p>

## License

[MIT License](./LICENSE.md).