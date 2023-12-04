import { join, sep } from 'path'
import { accessSync } from 'fs'

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
  catch (err) {
    return false
  }
}