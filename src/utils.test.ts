import { describe, expect, it } from 'vitest'
import { extractCargoArgs, extractProgramArgs, parseCargoArtifacts, parseCargoCommand } from './utils'

describe('parseCargoCommand', () => {
    it('parses plain cargo commands', () => {
        expect(parseCargoCommand('cargo run --release')).toEqual(['run', '--release'])
        expect(parseCargoCommand('cargo test')).toEqual(['test'])
    })

    it('returns null for non-cargo commands', () => {
        expect(parseCargoCommand('npm run dev')).toBeNull()
        expect(parseCargoCommand('cargo')).toBeNull()
        expect(parseCargoCommand('cargo   ')).toBeNull()
        expect(parseCargoCommand('')).toBeNull()
    })

    it('keeps quoted arguments intact', () => {
        expect(parseCargoCommand('cargo run -- --msg "hello world"')).toEqual(['run', '--', '--msg', 'hello world'])
        expect(parseCargoCommand('cargo run --msg \'a b\'')).toEqual(['run', '--msg', 'a b'])
    })

    it('trims surrounding whitespace', () => {
        expect(parseCargoCommand('  cargo build  ')).toEqual(['build'])
    })
})

describe('extractCargoArgs / extractProgramArgs', () => {
    it('splits cargo args and program args at --', () => {
        const args = ['test', '--lib', '--', '--nocapture']
        expect(extractCargoArgs(args)).toEqual(['test', '--lib'])
        expect(extractProgramArgs(args)).toEqual(['--nocapture'])
    })

    it('returns full args as cargo args when no separator', () => {
        const args = ['build', '--release']
        expect(extractCargoArgs(args)).toEqual(['build', '--release'])
        expect(extractProgramArgs(args)).toEqual([])
    })

    it('handles trailing separator without program args', () => {
        expect(extractCargoArgs(['run', '--'])).toEqual(['run'])
        expect(extractProgramArgs(['run', '--'])).toEqual([])
    })
})

describe('parseCargoArtifacts', () => {
    it('collects test/bench executables from cargo json output', () => {
        const stdout = [
            JSON.stringify({ reason: 'compiler-artifact', package_id: 'path+file:///Users/x/nes-sim/nes-sim#0.3.0', executable: '/t/deps/nes_sim-1', profile: { test: true }, target: { name: 'nes_sim', kind: ['lib'] } }),
            JSON.stringify({ reason: 'compiler-artifact', package_id: 'path+file:///Users/x/nes-sim/nes-desktop#0.1.0', executable: '/t/deps/nes_desktop-2', profile: { test: true }, target: { name: 'nes_desktop', kind: ['bin'] } }),
            JSON.stringify({ reason: 'compiler-artifact', package_id: 'registry+https://github.com/rust-lang/crates.io-index#objc2@0.6.4', executable: '/t/deps/build-3', profile: { test: false }, target: { name: 'build-script-build', kind: ['custom-build'] } }),
            JSON.stringify({ reason: 'compiler-message', rendered: 'warning: unused variable' }),
            '   Compiling nes-sim v0.1.0',
            'not json at all',
        ].join('\n')

        expect(parseCargoArtifacts(stdout)).toEqual([
            { executable: '/t/deps/nes_sim-1', package: 'nes-sim', name: 'nes_sim', kind: 'lib' },
            { executable: '/t/deps/nes_desktop-2', package: 'nes-desktop', name: 'nes_desktop', kind: 'bin' },
        ])
    })

    it('includes bench artifacts', () => {
        const stdout = JSON.stringify({ reason: 'compiler-artifact', package_id: 'p 0.1.0 (path+file:///t)', executable: '/t/bench-1', profile: { bench: true }, target: { name: 'bench', kind: ['bench'] } })
        expect(parseCargoArtifacts(stdout)).toEqual([{ executable: '/t/bench-1', package: 'p', name: 'bench', kind: 'bench' }])
    })

    it('returns empty for plain output', () => {
        expect(parseCargoArtifacts('Compiling foo\nFinished dev profile')).toEqual([])
    })
})
