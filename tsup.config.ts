import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    target: 'esnext',
    splitting: false,
    sourcemap: false,
    clean: true,
    external: [
        'vscode',
    ],
    noExternal: ['fast-glob', '@iarna/toml'],
    format: ['cjs'],
})
