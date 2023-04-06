<p align="center">
<img src="https://taiyuuki.gallerycdn.vsassets.io/extensions/taiyuuki/vscode-cargo-scripts/0.0.1/1680743890799/Microsoft.VisualStudio.Services.Icons.Default"  />
</p>


<h1 align="center">Cargo Scripts</h1>

<p align="center"><a href="https://marketplace.visualstudio.com/items?itemName=taiyuuki.vscode-cargo-scripts">
    <img alt="Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/taiyuuki.vscode-cargo-scripts?color=%23813c85&label=Marketplace&logo=visual%20studio%20code"></a></p>

`Cargo Scripts` is a Visual Studio Code extension which allows you to run scripts in the sidebar according to the `Cargo.toml`. 

Just like the scripts in NPM's `package.json`.

## Usage

Adding a `[package.metadata.scripts]` section to the `Cargo.toml`.

The file name should be case sensitive, cannot be `cargo.toml` or `CARGO.toml`.

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

## Settings

By default, the first time a script is run, a terminal will be created, and each subsequent script will run on the same terminal.

If you want to create a separate terminal for each script, you can set this option to true.

`settings.json`

```json
{
    "cargoScripts.terminal": true
}
```

## License

[MIT License](./LICENSE.md).