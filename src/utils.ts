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
