# vscode-cargo-scripts

`vscode-cargo-scripts` 是一个VS Code插件，让你可以在 `Cargo.toml`中配置命令行脚本，然后就能在编辑器的侧边栏显示并点击运行。

就像NPM的`package.json`中的`scripts`字段一样。

## 使用

在`Cargo.toml`添加 `[package.metadata.scripts]` 

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