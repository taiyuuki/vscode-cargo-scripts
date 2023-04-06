# vscode-cargo-scripts

`vscode-cargo-scripts` is a Visual Studio Code extension which allows you to run scripts in the sidebar according to the `Cargo.toml`. 

Just like the scripts in NPM's `package.json`.

## Usage

Adding a `[package.metadata.scripts]` section to the `Cargo.toml`(The file name is case sensitive). 

For example

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

If you want to create a separate terminal for each script, You can set this option to true.

`settings.json`

```json
{
    "cargoScripts.terminal": true
}
```

## License

[MIT License](./LICENSE.md).