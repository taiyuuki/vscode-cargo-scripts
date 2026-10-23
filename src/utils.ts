import { join, sep } from 'node:path'
import { accessSync } from 'node:fs'

export function getTomlPath(base: string) {
    return join(base, 'Cargo.toml')
}

export function replaceRootPath(path: string, workspace: string) {
    return path.replace(workspace + sep, '')
}

export function pathExists(path: string) {
    try {
        accessSync(path)

        return true
    }
    catch(_err) {
        return false
    }
}

export function objEntries<T extends Record<string, unknown>>(obj: T): [string, T[keyof T]][] {
    return Object.entries(obj) as [string, T[keyof T]][]
}

export function escapeRegExp(str: string) {
    return str.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
}

/**
 * Extract program arguments (after --) from cargo args
 */
export function extractProgramArgs(args: string[]): string[] {
    const separatorIndex = args.indexOf('--')
    if (separatorIndex !== -1 && separatorIndex + 1 < args.length) {
        return args.slice(separatorIndex + 1)
    }

    return []
}

/**
 * Extract cargo-only arguments (before --)
 */
export function extractCargoArgs(args: string[]): string[] {
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
export function parseCargoCommand(cmd: string): string[] | null {
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

export interface CargoArtifact {
    executable: string
    package:    string
    name:       string
    kind:       string
}

/**
 * Parse `cargo --message-format=json` output and return the built test/bench
 * executables that can be debugged.
 */
export function parseCargoArtifacts(stdout: string): CargoArtifact[] {
    const artifacts: CargoArtifact[] = []
    for (const line of stdout.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('{')) {
            continue
        }

        let message: {
            reason?:     string
            package_id?: string
            executable?: string | null
            profile?:    { test?: boolean, bench?: boolean }
            target?:     { name?: string, kind?: string[] }
        }
        try {
            message = JSON.parse(trimmed)
        }
        catch {

            // Not a JSON line.
            continue
        }

        if (message.reason === 'compiler-artifact'
            && message.executable
            && (message.profile?.test || message.profile?.bench)) {
            artifacts.push({
                executable: message.executable,
                package:    parsePackageId(message.package_id ?? ''),
                name:       message.target?.name ?? '',
                kind:       message.target?.kind?.join('/') ?? '',
            })
        }
    }

    return artifacts
}

/**
 * Extract the package name from a cargo `package_id`:
 * - registry style `registry+https://…#name@version` → name before `@`
 * - path style `path+file:///dir/name#version` → last path segment before `#`
 * - legacy style `name version (source)` → first token
 */
function parsePackageId(packageId: string): string {
    const hashIndex = packageId.lastIndexOf('#')
    if (hashIndex !== -1) {
        const tail = packageId.slice(hashIndex + 1)
        const atIndex = tail.indexOf('@')
        if (atIndex !== -1) {
            return tail.slice(0, atIndex)
        }

        const segments = packageId.slice(0, hashIndex).split('/')
        for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i]) {
                return segments[i]
            }
        }

        return tail
    }

    return packageId.split(' ')[0]
}
