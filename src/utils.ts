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
    catch (_err) {
        return false
    }
}

export function objEntries<T extends Record<string, unknown>>(obj: T): [string, T[keyof T]][] {
    return Object.entries(obj) as [string, T[keyof T]][]
}

