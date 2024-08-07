import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    target: 'esnext',
    splitting: false,
    sourcemap: true,
    clean: true,
    external: [
        'vscode',
    ],
    noExternal: ['fast-glob', '@iarna/toml'],
    format: ['cjs'],
})
