import { resolve } from 'node:path'
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
    const runDispose = vscode.commands.registerCommand('cargoScripts.run', item => {
        if (pathExists(item.cwd)) {
            if (item.cwd.match(/.*?\.cargo$/)) {
                executeCommand(item.label, item.cmd, resolve(item.cwd, '..'))
            }
            else {
                executeCommand(item.label, item.cmd, item.cwd)
            }
        }
        else {
            scriptsTree.emitDataChange.call(scriptsTree)
        }
    })
    const openDispose = vscode.commands.registerCommand('cargoScripts.open', (name, cwd, description) => {
        if (pathExists(cwd)) {
            vscode.workspace.openTextDocument(vscode.Uri.file(cwd)).then(doc => {
                const reg = new RegExp(`${name}\\s*=\\s*[\\"\\']${description}[\\"\\']`, 'i')
                const match = reg.exec(doc.getText())
                if (match) {
                    const pst = match.index
                    vscode.window.showTextDocument(doc, { selection: new vscode.Range(doc.positionAt(pst), doc.positionAt(pst + match[0].length)) })
                }
                else {
                    vscode.window.showTextDocument(doc)
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
            let linePrefix = document.lineAt(position).text.substring(0, position.character)
            const len = linePrefix.length
            linePrefix = linePrefix.trim()
            const detail = 'Cargo Scripts'
            const packageScripts = 'package.metadata.scripts'
            const workspaceScripts = 'workspace.metadata.scripts'
            if (!linePrefix.startsWith('[') && !linePrefix.startsWith('[')) {
                return void 0
            }

            return [
                {
                    detail,
                    documentation: new vscode.MarkdownString(`
# Example

\`\`\`toml
[package.metadata.scripts]
run = "cargo run"
check = "cargo check"
test = "cargo test"
build = "cargo build"
\`\`\`  
                `.trim()),
                    kind: vscode.CompletionItemKind.Field,
                    label: packageScripts,
                    filterText: packageScripts,
                    insertText: `${packageScripts}]`,
                    range: new vscode.Range(position.line, 1, position.line, Math.max(len, packageScripts.length)),
                },
                {
                    detail,
                    documentation: new vscode.MarkdownString(`
# Example

\`\`\`toml
[workspace.metadata.scripts]
run = "cargo run"
check = "cargo check"
test = "cargo test"
build = "cargo build"
\`\`\`
`.trim()),
                    kind: vscode.CompletionItemKind.Field,
                    label: workspaceScripts,
                    filterText: workspaceScripts,
                    insertText: `${workspaceScripts}]`,
                    range: new vscode.Range(position.line, 1, position.line, Math.max(len, workspaceScripts.length)),
                },
            ]
        },
    }, '.')

    context.subscriptions.push(treeData, runDispose, openDispose, refreshDispose, completionDispose)
}

export function deactivate(context: vscode.ExtensionContext) {
    context.subscriptions.forEach(d => d.dispose())
    vscode.commands.executeCommand('setContext', 'showCargoScript', false)
}
