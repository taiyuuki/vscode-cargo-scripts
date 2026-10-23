import { spawn } from 'node:child_process'
import * as vscode from 'vscode'
import type { CargoArtifact } from './utils'
import { extractCargoArgs, extractProgramArgs, parseCargoArtifacts, parseCargoCommand } from './utils'

/**
 * Cargo subcommands that never launch a debuggable target:
 * `watch` runs nested cargo invocations without CodeLLDB's injected runner,
 * and the rest only produce artifacts/diagnostics or manage the workspace.
 */
const NON_DEBUGGABLE_SUBCOMMANDS = new Set([
    'add', 'c', 'check', 'clean', 'clippy', 'config', 'doc', 'fetch', 'fix', 'fmt',
    'generate-lockfile', 'help', 'init', 'install', 'locate-project', 'login', 'logout',
    'metadata', 'new', 'owner', 'package', 'publish', 'remove', 'report', 'search',
    'tree', 'update', 'vendor', 'verify-project', 'version', 'watch', 'yank',
])

/**
 * `cargo test`/`cargo bench` invoke the runner once per test target, which breaks
 * CodeLLDB's cargo mode: only the first target gets debugged, the rest fail with
 * "Connection refused". These subcommands are built with `--no-run` and debugged
 * as explicit binaries instead - the same strategy rust-analyzer uses.
 */
const TEST_SUBCOMMANDS = new Set(['test', 't', 'bench'])

const outputChannel = vscode.window.createOutputChannel('Cargo Scripts')

/**
 * Debug actions are only offered when CodeLLDB is installed.
 */
export function isCodeLLDBInstalled() {
    return !!vscode.extensions.getExtension('vadimcn.vscode-lldb')
}

export async function debugCommand(label: string, cmd: string, cwd: string) {
    const args = parseCargoCommand(cmd)

    if (!args) {
        vscode.window.showWarningMessage(`'${label}' is not a cargo command. Only cargo commands can be debugged.`)

        return
    }

    if (NON_DEBUGGABLE_SUBCOMMANDS.has(args[0])) {
        vscode.window.showWarningMessage(`'${label}': cargo ${args[0]} does not launch a debuggable target.`)

        return
    }

    if (!isCodeLLDBInstalled()) {
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

    if (TEST_SUBCOMMANDS.has(args[0])) {
        return debugTestCommand(label, args, cwd)
    }

    const programArgs = extractProgramArgs(args)
    const cargoArgs = extractCargoArgs(args)

    // Create debug configuration using CodeLLDB's cargo mode
    // CodeLLDB will handle the build automatically
    const debugConfig: vscode.DebugConfiguration = {
        type:    'lldb',
        request: 'launch',
        name:    `Debug: ${label}`,
        cargo:   { args: cargoArgs },
        args:    programArgs,
        cwd:     cwd,
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(cwd))
    const success = await vscode.debug.startDebugging(workspaceFolder, debugConfig)

    if (!success) {
        vscode.window.showErrorMessage(`Failed to start debugging: ${label}`)
    }
}

/**
 * Debug `cargo test`/`cargo bench` scripts: build all targets with `--no-run`,
 * pick the test executable to debug, then launch it as an explicit program.
 */
async function debugTestCommand(label: string, args: string[], cwd: string) {
    const programArgs = extractProgramArgs(args)
    const cargoArgs = extractCargoArgs(args)
    if (!cargoArgs.includes('--no-run')) {
        cargoArgs.push('--no-run')
    }
    cargoArgs.push('--message-format=json', '--color=never')

    const artifacts = await buildArtifacts(cargoArgs, cwd, label)
    if (!artifacts || artifacts.length === 0) {
        vscode.window.showErrorMessage(`'${label}': no debuggable target was built.`)

        return
    }

    let artifact = artifacts[0]
    if (artifacts.length > 1) {
        const picked = await vscode.window.showQuickPick(
            artifacts.map(a => ({
                label:       `${a.package}/${a.name}`,
                description: a.kind,
                detail:      a.executable,
                artifact:    a,
            })),
            { placeHolder: `Select a test target to debug (${label})` },
        )
        if (!picked) {
            return
        }
        artifact = picked.artifact
    }

    const debugConfig: vscode.DebugConfiguration = {
        type:            'lldb',
        request:         'launch',
        name:            `Debug: ${label}`,
        program:         artifact.executable,
        args:            programArgs,
        cwd:             cwd,
        sourceLanguages: ['rust'],
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(cwd))
    const success = await vscode.debug.startDebugging(workspaceFolder, debugConfig)

    if (!success) {
        vscode.window.showErrorMessage(`Failed to start debugging: ${label}`)
    }
}

function buildArtifacts(cargoArgs: string[], cwd: string, label: string): Thenable<CargoArtifact[] | undefined> {
    return vscode.window.withProgress(
        {
            location:    vscode.ProgressLocation.Notification,
            title:       `Cargo Scripts: building targets for '${label}'…`,
            cancellable: true,
        },
        (_progress, token) =>
            new Promise(resolve => {
                const child = spawn('cargo', cargoArgs, { cwd })
                token.onCancellationRequested(() => child.kill())
                let stdout = ''
                child.stdout.on('data', (chunk: Buffer) => {
                    stdout += chunk
                })
                child.stderr.on('data', (chunk: Buffer) => {
                    outputChannel.append(chunk.toString())
                })
                child.on('error', err => {
                    vscode.window.showErrorMessage(`Failed to run cargo: ${err.message}`)
                    resolve(undefined)
                })
                child.on('close', code => {
                    if (code !== 0) {
                        outputChannel.show()
                        vscode.window.showErrorMessage(`'${label}': cargo exited with code ${code}.`)

                        resolve(undefined)

                        return
                    }
                    resolve(parseCargoArtifacts(stdout))
                })
            }),
    )
}
