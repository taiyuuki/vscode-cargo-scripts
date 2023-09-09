import * as vscode from 'vscode'
import { executeCommand } from './terminal'
import { CargoScriptsTree } from './scriptsTree'
import { pathExists } from './utils'

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : __dirname

  const scriptsTree = new CargoScriptsTree(workspaceFolders)
  const treeData = vscode.window.registerTreeDataProvider('cargoScripts', scriptsTree)
  const runDispose = vscode.commands.registerCommand('cargoScripts.run', (item) => {
    if (pathExists(item.cwd)) {
      executeCommand(item.label, item.cmd, item.cwd)
    }
    else {
      scriptsTree.emitDataChange.call(scriptsTree)
    }
  })
  const openDispose = vscode.commands.registerCommand('cargoScripts.open', (label, cmd, cwd) => {
    if (pathExists(cwd)) {
      vscode.workspace.openTextDocument(vscode.Uri.file(cwd)).then((doc) => {
        const pst = doc.getText().indexOf(cmd)
        if (pst < 0) {
          vscode.window.showTextDocument(doc)
        }
        else {
          vscode.window.showTextDocument(doc, { selection: new vscode.Range(doc.positionAt(pst), doc.positionAt(pst + cmd.length)) })
        }
      })
    }
    else {
      scriptsTree.emitDataChange.call(scriptsTree)
    }
  })
  const refreshDispose = vscode.commands.registerCommand('cargoScripts.refresh', scriptsTree.emitDataChange.bind(scriptsTree))
  const completionDispose = vscode.languages.registerCompletionItemProvider([{ language: 'toml', pattern: '**/Cargo.toml' }], {
    provideCompletionItems(document, position) {
      const linePrefix = document.lineAt(position).text.substring(0, position.character)
      const detail = 'Cargo Scripts'
      const documentation = new vscode.MarkdownString(`
# Example

\`\`\`toml
[package.metadata.scripts]
run = "cargo run"
check = "cargo check"
test = "cargo test"
build = "cargo build"
\`\`\`  
      `.trim())
      if (linePrefix.startsWith('[package.metadata.')) {
        return [
          {
            detail,
            documentation,
            kind: vscode.CompletionItemKind.Field,
            label: 'package.metadata.scripts',
            insertText: 'scripts',
          },
        ]
      }
      else if (linePrefix.startsWith('[package.')) {
        return [
          {
            detail,
            documentation,
            kind: vscode.CompletionItemKind.Field,
            label: 'package.metadata',
            insertText: 'metadata',
          },
          {
            detail,
            documentation,
            kind: vscode.CompletionItemKind.Field,
            label: 'package.metadata.scripts',
            insertText: 'metadata.scripts',
          },
        ]
      }
      else {
        return void 0
      }
    },
  }, '.')

  context.subscriptions.push(treeData, runDispose, openDispose, refreshDispose, completionDispose)
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((d) => d.dispose())
  vscode.commands.executeCommand('setContext', 'showCargoScript', false)
}