import path from 'node:path'
import * as vscode from 'vscode'

export function executeCommand(label: string, cmd: string, cwd: string) {
    let terminal: vscode.Terminal
    const separate = vscode.workspace.getConfiguration().get('cargoScripts.terminal')
    const terminalName = separate ? `${path.basename(cwd)}: ${label}` : path.basename(cwd)
    const findTerminal = vscode.window.terminals.find(ter => {
        return ter.name === terminalName
    })
    if (findTerminal) {
        terminal = findTerminal
    }
    else {
        const terminalOptions: vscode.TerminalOptions = {
            name: terminalName,
            cwd,
            hideFromUser: true,
            iconPath: new vscode.ThemeIcon('tools'),
        }

        terminal = vscode.window.createTerminal(terminalOptions)
    }

    terminal.show()
    terminal.sendText(cmd)
}

/**
 * Extract program arguments (after --) from cargo args
 */
function extractProgramArgs(args: string[]): string[] {
    const separatorIndex = args.indexOf('--')
    if (separatorIndex !== -1 && separatorIndex + 1 < args.length) {
        return args.slice(separatorIndex + 1)
    }

    return []
}

/**
 * Extract cargo-only arguments (before --)
 */
function extractCargoArgs(args: string[]): string[] {
    const separatorIndex = args.indexOf('--')
    if (separatorIndex !== -1) {
        return args.slice(0, separatorIndex)
    }

    return args
}

/**
 * Parse cargo command to extract arguments
 * @param cmd - The full command string (e.g., "cargo run --release" or "cargo r --release")
 * @returns Array of cargo arguments or null if not a cargo command
 */
function parseCargoCommand(cmd: string): string[] | null {
    const trimmed = cmd.trim()

    // Check if it's a cargo command
    if (!trimmed.startsWith('cargo ')) {
        return null
    }

    // Remove 'cargo ' prefix and split into arguments
    const argsStr = trimmed.slice(6).trim()
    if (!argsStr) {
        return null
    }

    // Simple argument parsing (handles quoted strings)
    const args: string[] = []
    let current = ''
    let inQuote = false
    let quoteChar = ''

    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i]

        if (inQuote) {
            if (char === quoteChar) {
                inQuote = false
            }
            else {
                current += char
            }
        }
        else if (char === '"' || char === '\'') {
            inQuote = true
            quoteChar = char
        }
        else if (char === ' ') {
            if (current) {
                args.push(current)
                current = ''
            }
        }
        else {
            current += char
        }
    }

    if (current) {
        args.push(current)
    }

    return args
}

export async function debugCommand(label: string, cmd: string, cwd: string) {
    const args = parseCargoCommand(cmd)

    if (!args) {
        vscode.window.showWarningMessage(`'${label}' is not a cargo command. Only cargo commands can be debugged.`)

        return
    }

    // Check if CodeLLDB is installed
    const lldbExtension = vscode.extensions.getExtension('vadimcn.vscode-lldb')
    if (!lldbExtension) {
        const install = await vscode.window.showErrorMessage(
            'CodeLLDB extension is required for debugging Rust code. Would you like to install it?',
            'Open in Marketplace',
            'Cancel',
        )

        if (install === 'Open in Marketplace') {
            vscode.commands.executeCommand('extension.open', 'vadimcn.vscode-lldb')
        }

        return
    }

    // Extract program arguments (after --)
    const programArgs = extractProgramArgs(args)
    const cargoArgs = extractCargoArgs(args)

    // Create debug configuration using CodeLLDB's cargo mode
    // CodeLLDB will handle the build automatically
    const debugConfig: vscode.DebugConfiguration = {
        type: 'lldb',
        request: 'launch',
        name: `Debug: ${label}`,
        cargo: { args: cargoArgs },
        args: programArgs,
        cwd: cwd,
    }

    // Start debugging
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(cwd))
    const success = await vscode.debug.startDebugging(workspaceFolder, debugConfig)

    if (!success) {
        vscode.window.showErrorMessage(`Failed to start debugging: ${label}`)
    }
}
