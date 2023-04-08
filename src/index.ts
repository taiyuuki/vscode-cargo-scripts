import * as vscode from 'vscode'
import { executeCommand } from './terminal'
import { CargoScriptsTree } from './scriptsTree'

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : __dirname

  const scriptsTree = new CargoScriptsTree(workspaceFolders)
  const treeData = vscode.window.registerTreeDataProvider('cargoScripts', scriptsTree)
  const runDispose = vscode.commands.registerCommand('cargoScripts.run', (lable: string, cmd: string, cwd: string) => {
    executeCommand(cmd, lable, cwd)
  })
  const refreshDispose = vscode.commands.registerCommand('cargoScripts.refresh', scriptsTree.emitDataChange.bind(scriptsTree))
  const completionDispose = vscode.languages.registerCompletionItemProvider([{ language: 'toml', pattern: '**/Cargo.toml' }], {
    provideCompletionItems(document, position) {
      const linePrefix = document.lineAt(position).text.substring(0, position.character)
      if (linePrefix.startsWith('[package.metadata.')) {
        return [
          new vscode.CompletionItem('scripts', vscode.CompletionItemKind.Text),
        ]
      }
      else if (linePrefix.startsWith('[package.')) {
        return [
          new vscode.CompletionItem('metadata', vscode.CompletionItemKind.Text),
          new vscode.CompletionItem('metadata.scripts', vscode.CompletionItemKind.Text),
        ]
      }
      else {
        return void 0
      }
    },
  }, '.')

  context.subscriptions.push(treeData)
  context.subscriptions.push(runDispose)
  context.subscriptions.push(refreshDispose)
  context.subscriptions.push(completionDispose)
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((d) => d.dispose())
  vscode.commands.executeCommand('setContext', 'showCargoScript', false)
}