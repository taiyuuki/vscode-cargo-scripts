import { dirname, join } from 'node:path'
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
    cmd: string
    cwd: string

    constructor(label: string, cmd: string, cwd: string, description?: string) {
        super(label, vscode.TreeItemCollapsibleState.None)
        this.name = label
        this.command = {
            title: 'Open',
            command: 'cargoScripts.open',
            arguments: [label, cwd, description],
        }
        cwd = dirname(cwd)
        this.cmd = cmd
        this.cwd = cwd
        this.tooltip = description
        this.description = description
        this.contextValue = 'script_item'
    }

    iconPath = new vscode.ThemeIcon('wrench')
}
