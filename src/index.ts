import * as vscode from 'vscode'
import { debugCommand, isCodeLLDBInstalled } from './debug'
import { executeCommand } from './terminal'
import { CargoScriptsTree } from './scriptsTree'
import { CargoScriptsCodeLensProvider } from './codeLens'
import { escapeRegExp, pathExists } from './utils'

/**
 * Locate the `name = "description"` entry in a TOML document.
 * All interpolated content is escaped to prevent RegExp injection,
 * and failures fall back to opening the document without a selection.
 */
function findScriptRange(doc: vscode.TextDocument, name: string, description: string): vscode.Range | undefined {
    const nameRe = escapeRegExp(name)
    const valueRe = escapeRegExp(description)
        .replace(/"/g, '["\']')
        .replace(/\s+/g, '\\s+')

    try {
        const match = new RegExp(`^[ \\t]*${nameRe}[ \\t]*=[ \\t]*["']?${valueRe}["']?`, 'im').exec(doc.getText())
        if (match) {
            return new vscode.Range(doc.positionAt(match.index), doc.positionAt(match.index + match[0].length))
        }
    }
    catch {

        // Malformed pattern or unexpected input: fall back to no selection.
    }

    return undefined
}

export function activate(context: vscode.ExtensionContext) {
    vscode.commands.executeCommand('setContext', 'showCargoScript', false)

    // Debug actions (CodeLens + tree icons) are only offered when CodeLLDB is installed.
    const updateDebugAvailable = () => {
        vscode.commands.executeCommand('setContext', 'cargoScripts.debugAvailable', isCodeLLDBInstalled())
    }
    updateDebugAvailable()
    const extensionsDispose = vscode.extensions.onDidChange(updateDebugAvailable)

    const workspaceFolders = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : __dirname

    const scriptsTree = new CargoScriptsTree(workspaceFolders)
    const treeData = vscode.window.registerTreeDataProvider('cargoScripts', scriptsTree)
    const runDispose = vscode.commands.registerCommand('cargoScripts.run', item => {
        if (!item?.cwd) {
            return
        }
        if (!pathExists(item.cwd)) {
            scriptsTree.emitDataChange.call(scriptsTree)

            return
        }
        executeCommand(item.label, item.cmd, item.cwd)
    })
    const debugDispose = vscode.commands.registerCommand('cargoScripts.debug', item => {
        if (!item?.cwd) {
            return
        }
        if (!pathExists(item.cwd)) {
            scriptsTree.emitDataChange.call(scriptsTree)

            return
        }
        debugCommand(item.label, item.cmd, item.cwd)
    })
    const openDispose = vscode.commands.registerCommand('cargoScripts.open', (name, cwd, description) => {
        if (typeof name !== 'string' || typeof cwd !== 'string' || !pathExists(cwd)) {
            scriptsTree.emitDataChange.call(scriptsTree)

            return
        }
        vscode.workspace.openTextDocument(vscode.Uri.file(cwd)).then(doc => {
            const range = findScriptRange(doc, name, typeof description === 'string' ? description : '')

            if (range) {
                vscode.window.showTextDocument(doc, { selection: range })
            }
            else {
                vscode.window.showTextDocument(doc)
            }
        })
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
            if (!linePrefix.startsWith('[')) {
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
                    kind:       vscode.CompletionItemKind.Field,
                    label:      packageScripts,
                    filterText: packageScripts,
                    insertText: `${packageScripts}]`,
                    range:      new vscode.Range(position.line, 1, position.line, Math.max(len, packageScripts.length)),
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
                    kind:       vscode.CompletionItemKind.Field,
                    label:      workspaceScripts,
                    filterText: workspaceScripts,
                    insertText: `${workspaceScripts}]`,
                    range:      new vscode.Range(position.line, 1, position.line, Math.max(len, workspaceScripts.length)),
                },
            ]
        },
    }, '.')

    // Register CodeLens provider for Cargo.toml and .cargo/config.toml
    const codeLensProvider = new CargoScriptsCodeLensProvider()
    const codeLensDispose = vscode.languages.registerCodeLensProvider([
        { language: 'toml', pattern: '**/Cargo.toml' },
        { language: 'toml', pattern: '**/.cargo/config.toml' },
        { language: 'toml', pattern: '**/.cargo/config' },
    ], codeLensProvider)

    context.subscriptions.push(treeData, scriptsTree, extensionsDispose, runDispose, debugDispose, openDispose, refreshDispose, completionDispose, codeLensDispose)
}

export function deactivate() {}
