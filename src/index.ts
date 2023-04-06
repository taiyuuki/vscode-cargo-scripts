import * as vscode from 'vscode'
import { executeCommand } from './terminal'
import { CargoScriptsTree } from './scriptsTree'

export function activate(context: vscode.ExtensionContext) {
  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : __dirname

  const scriptsTree = new CargoScriptsTree(folder)
  const treeData = vscode.window.registerTreeDataProvider('cargoScripts', scriptsTree)

  const runDispose = vscode.commands.registerCommand('cargoScripts.run', (lable: string, cmd: string, cwd: string) => {
    executeCommand(cmd, lable, cwd)
  })
  const refreshDispose = vscode.commands.registerCommand('cargoScripts.refresh', scriptsTree.onDidChangeTreeData)

  context.subscriptions.push(treeData)
  context.subscriptions.push(runDispose)
  context.subscriptions.push(refreshDispose)
  vscode.commands.executeCommand('setContext', 'showCargoScript', true)
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((d) => d.dispose())
  vscode.commands.executeCommand('setContext', 'showCargoScript', false)
}