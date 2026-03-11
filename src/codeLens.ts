import * as vscode from 'vscode'
import { parse } from '@iarna/toml'

interface ScriptInfo {
    key:   string
    value: string
    cmd:   string
    line:  number
    cwd:   string
}

export class CargoScriptsCodeLensProvider implements vscode.CodeLensProvider {
    private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

    constructor() {

        // Refresh code lenses when configuration changes
        vscode.workspace.onDidChangeConfiguration(() => {
            this._onDidChangeCodeLenses.fire()
        })
    }

    async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = []
        const filePath = document.uri.fsPath
        const fileName = filePath.toLowerCase()

        // Only process Cargo.toml and .cargo/config.toml (or config)
        const isCargoToml = fileName.endsWith('cargo.toml')
        const isCargoConfig = fileName.includes('.cargo') && (fileName.endsWith('config.toml') || fileName.endsWith('config'))

        if (!isCargoToml && !isCargoConfig) {
            return codeLenses
        }

        const scripts = this._parseScripts(document, isCargoConfig)

        for (const script of scripts) {
            const range = new vscode.Range(script.line, 0, script.line, 0)

            // Run CodeLens
            const runLens = new vscode.CodeLens(range, {
                title:     `$(run) ${vscode.l10n.t('vscode-cargo-scripts.Run')}`,
                command:   'cargoScripts.run',
                tooltip:   `${vscode.l10n.t('vscode-cargo-scripts.Run')}: ${script.key}`,
                arguments: [{
                    label: script.key,
                    cmd:   script.cmd,
                    cwd:   script.cwd,
                }],
            })
            codeLenses.push(runLens)

            // Debug CodeLens
            const debugLens = new vscode.CodeLens(range, {
                title:     `$(debug-alt) ${vscode.l10n.t('vscode-cargo-scripts.Debug')}`,
                command:   'cargoScripts.debug',
                tooltip:   `${vscode.l10n.t('vscode-cargo-scripts.Debug')}: ${script.key}`,
                arguments: [{
                    label: script.key,
                    cmd:   script.cmd,
                    cwd:   script.cwd,
                }],
            })
            codeLenses.push(debugLens)
        }

        return codeLenses
    }

    private _parseScripts(document: vscode.TextDocument, isCargoConfig: boolean): ScriptInfo[] {
        const scripts: ScriptInfo[] = []
        const text = document.getText()

        let toml: Record<string, any>
        try {
            toml = parse(text) as Record<string, any>
        }
        catch {
            return scripts
        }

        const filePath = document.uri.fsPath

        // For .cargo/config.toml, cwd should be the parent of .cargo folder
        const cwd = isCargoConfig
            ? filePath.replace(/[/\\]\.cargo[/\\].*$/, '')
            : filePath.replace(/[/\\]cargo\.toml$/i, '')

        if (isCargoConfig) {

            // Parse [alias] section in .cargo/config.toml
            const alias = toml?.alias
            if (alias && typeof alias === 'object') {
                for (const [key, value] of Object.entries(alias)) {
                    const line = this._findScriptLine(document, key, 'alias')
                    if (line !== -1) {
                        const expandedValue = Array.isArray(value) ? value.join(' ') : value
                        scripts.push({
                            key,
                            value: typeof value === 'string' ? value : JSON.stringify(value),
                            cmd:   `cargo ${expandedValue}`,
                            line,
                            cwd,
                        })
                    }
                }
            }
        }
        else {

            // Parse [package.metadata.scripts] and [workspace.metadata.scripts] in Cargo.toml
            const packageScripts = toml?.package?.metadata?.scripts
            const workspaceScripts = toml?.workspace?.metadata?.scripts

            if (packageScripts && typeof packageScripts === 'object') {
                for (const [key, value] of Object.entries(packageScripts)) {
                    const line = this._findScriptLine(document, key, 'package.metadata.scripts')
                    if (line !== -1) {
                        scripts.push({
                            key,
                            value: String(value),
                            cmd:   String(value),
                            line,
                            cwd,
                        })
                    }
                }
            }

            if (workspaceScripts && typeof workspaceScripts === 'object') {
                for (const [key, value] of Object.entries(workspaceScripts)) {
                    const line = this._findScriptLine(document, key, 'workspace.metadata.scripts')
                    if (line !== -1) {
                        scripts.push({
                            key,
                            value: String(value),
                            cmd:   String(value),
                            line,
                            cwd,
                        })
                    }
                }
            }
        }

        return scripts
    }

    private _findScriptLine(
        document: vscode.TextDocument,
        key: string,
        section: string,
    ): number {
        const text = document.getText()
        const lines = text.split('\n')

        // First, find the section header line
        let sectionLine = -1
        const sectionPattern = new RegExp(`^\\[${this._escapeRegex(section)}\\]`)

        for (let i = 0; i < lines.length; i++) {
            if (sectionPattern.test(lines[i].trim())) {
                sectionLine = i
                break
            }
        }

        if (sectionLine === -1) {
            return -1
        }

        // Then, find the key within that section (between section header and next section)
        for (let i = sectionLine + 1; i < lines.length; i++) {
            const line = lines[i].trim()

            // Stop if we hit another section
            if (line.startsWith('[')) {
                break
            }

            // Match patterns like: key = "value", key = 'value', key = [...]
            if (line.startsWith(`${key}`)) {
                const rest = line.slice(key.length).trim()
                if (rest.startsWith('=') || rest.startsWith(' =')) {
                    return i
                }
            }
        }

        return -1
    }

    private _escapeRegex(str: string): string {
        return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
    }
}
