import { join } from 'path'

export function getTomlPath(base: string) {
  return join(base, 'Cargo.toml')
}

export function replaceRootPath(path: string, workspace: string) {
  return path.replace(workspace + '\\', '')
}