import { join } from 'path'
import * as vscode from 'vscode'

const CARGO_LOGO = join(__dirname, '../res/cargo_logo.svg')

export class WorkspaceTreeItem extends vscode.TreeItem {
  constructor(
    public label: string,
    public scripts: Record<string, string>,
    state = vscode.TreeItemCollapsibleState.Expanded
  ) {
    super(label, state)
    this.scripts = scripts
  }

  iconPath = CARGO_LOGO
}

export class ScriptTreeItem extends vscode.TreeItem {
  name: string
  constructor(label: string, cmd: string, cwd: string) {
    super(label, vscode.TreeItemCollapsibleState.None)
    this.name = label
    this.command = {
      title: 'Run script',
      command: 'cargoScripts.run',
      arguments: [label, cmd, cwd.substring(0, cwd.lastIndexOf('\\'))],
    }
    this.tooltip = cmd
    this.description = cmd
  }

  iconPath = new vscode.ThemeIcon('symbol-property')
}