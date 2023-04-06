<p align="center">
<img src="https://taiyuuki.gallerycdn.vsassets.io/extensions/taiyuuki/vscode-cargo-scripts/0.0.1/1680743890799/Microsoft.VisualStudio.Services.Icons.Default"  />
</p>


<h1 align="center">Cargo Scripts</h1>

<p align="center"><a href="https://marketplace.visualstudio.com/items?itemName=taiyuuki.vscode-cargo-scripts">
    <img alt="Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/taiyuuki.vscode-cargo-scripts?color=%23813c85&label=Marketplace&logo=visual%20studio%20code"></a></p>
`Cargo Scripts` 是一个VS Code插件，让你可以在 `Cargo.toml`中配置命令行脚本，然后就能在编辑器的侧边栏显示并点击运行。

就像NPM的`package.json`中的`scripts`字段一样。

## 使用

在`Cargo.toml`添加 `[package.metadata.scripts]`，注意文件名区分大小写，不能是`cargo.toml`或`CARGO.toml`。

例如：

```toml
[package.metadata.scripts]
run = "cargo run"
check = "cargo check"
build = "cargo build"
release = "cargo build --release"
```

<p align="center">
<img src="https://s2.loli.net/2023/04/06/HwEItz9TR1Gcb7k.jpg" />
</p>

## 配置项

默认情况下，第一次运行`script`时会创建一个终端，随后的每一个`script`都会在同一个终端中运行。

如果你想让每一个脚本运行时创建独立、分离的终端，可以将这一项设为 true.

`settings.json`

```json
{
    "cargoScripts.terminal": true
}
```

## License

[MIT License](./LICENSE.md).