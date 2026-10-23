import { basename, dirname, join } from 'node:path'
import * as vscode from 'vscode'

const CARGO_LOGO = join(__dirname, '../res/cargo_logo.svg')

export type ScriptItem = Record<string, { description: string, cmd: string }>

export class WorkspaceTreeItem extends vscode.TreeItem {
    constructor(
        public label: string,
        public scripts: ScriptItem,
        state = vscode.TreeItemCollapsibleState.Expanded,
    ) {
        super(label, state)
        this.scripts = scripts
    }

    iconPath = CARGO_LOGO
}

export class ScriptTreeItem extends vscode.TreeItem {
    name: string
    cmd:  string
    cwd:  string

    constructor(label: string, cmd: string, tomlPath: string, description?: string) {
        super(label, vscode.TreeItemCollapsibleState.None)
        this.name = label

        // Clicking the item opens the TOML file where the script is defined.
        this.command = {
            title:     'Open',
            command:   'cargoScripts.open',
            arguments: [label, tomlPath, description],
        }

        // Working directory is the crate root: parent of Cargo.toml,
        // or the parent of the .cargo/ directory for config files.
        const dir = dirname(tomlPath)
        this.cwd = basename(dir) === '.cargo' ? dirname(dir) : dir
        this.cmd = cmd
        this.tooltip = description
        this.description = description
        this.contextValue = 'script_item'
    }

    iconPath = new vscode.ThemeIcon('wrench')
}
