import { join } from 'path'
import * as vscode from 'vscode'

// const FOLDER_ICON = vscode.ThemeIcon.Folder
const CARGO_LOGO = join(__dirname, '../res/cargo_logo.svg')

export class WorkspaceTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    state = vscode.TreeItemCollapsibleState.Expanded
  ) {
    super(label, state)
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