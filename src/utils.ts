import { join } from 'path'

export function getTomlPath(base: string) {
  return join(base, 'Cargo.toml')
}