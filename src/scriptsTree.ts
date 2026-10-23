import * as fs from 'node:fs'
import { basename, dirname, join } from 'node:path'
import * as vscode from 'vscode'
import { parse } from '@iarna/toml'
import fg from 'fast-glob'
import type { ScriptItem } from './treeItem'
import { ScriptTreeItem, WorkspaceTreeItem } from './treeItem'
import { objEntries, pathExists, replaceRootPath } from './utils'

export class CargoScriptsTree implements vscode.TreeDataProvider<ScriptTreeItem | WorkspaceTreeItem> {
    private readonly _onChangeTreeData = new vscode.EventEmitter<ScriptTreeItem | undefined>()
    public readonly onDidChangeTreeData = this._onChangeTreeData.event
    private readonly watcher: vscode.FileSystemWatcher
    private folders:          string[] = []

    constructor(private readonly workspaceRoot: string) {
        this._init()
        this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.workspaceRoot, '{**/Cargo.toml,**/.cargo/config.toml,**/.cargo/config}'))
        this.watcher.onDidChange(this.emitDataChange.bind(this))
        this.watcher.onDidCreate(this.emitDataChange.bind(this))
        this.watcher.onDidDelete(this.emitDataChange.bind(this))
    }

    dispose() {
        this.watcher.dispose()
        this._onChangeTreeData.dispose()
    }

    private async _init() {
        await this._refreshFolders()
        this._onChangeTreeData.fire(void 0)
    }

    private async _getFolders() {
        const results = await fg(['**/Cargo.toml', '**/.cargo/config.toml', '**/.cargo/config'], {
            cwd:                this.workspaceRoot,
            ignore:             [
                '**/node_modules/**',
                '**/target/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/out/**',
            ],
            caseSensitiveMatch: false,
        })

        return results.map(folder => join(this.workspaceRoot, folder))
    }

    private async _refreshFolders() {
        this.folders = await this._getFolders()
        this._showScriptTree(this._getWorkspaceTree().length > 0)
    }

    async emitDataChange(_e?: vscode.Uri) {
        await this._refreshFolders()
        this._onChangeTreeData.fire(void 0)
    }

    getTreeItem(element: ScriptTreeItem | WorkspaceTreeItem): vscode.TreeItem {
        return element
    }

    getChildren(element?: ScriptTreeItem | WorkspaceTreeItem): Thenable<(ScriptTreeItem | WorkspaceTreeItem)[]> {
        if (!this.workspaceRoot) {
            return Promise.resolve([])
        }
        if (element) {
            const path = this.folders.find(folder => replaceRootPath(folder, this.workspaceRoot) === element.label)
            if (path && 'scripts' in element) {
                return Promise.resolve(this._getScriptsTreeItem(path, element.scripts))
            }
            else {
                return Promise.resolve([])
            }
        }
        else if (this.folders.length > 0) {
            return Promise.resolve(this._getWorkspaceTree())
        }
        else {
            return Promise.resolve([])
        }
    }

    private _getWorkspaceTree() {
        const workspaceTreeItems: WorkspaceTreeItem[] = []
        this.folders.forEach(folder => {
            if (pathExists(folder)) {
                let toml: Record<string, any>
                try {
                    toml = parse(fs.readFileSync(folder, 'utf-8')) as Record<string, any>
                }
                catch {

                    // Skip invalid or half-edited TOML files instead of breaking the tree.
                    return
                }

                // [alias] only makes sense in .cargo/config.toml / .cargo/config
                const isCargoConfig = basename(dirname(folder)) === '.cargo'
                const alias = isCargoConfig ? toml?.alias : undefined
                if (alias) {
                    const scripts: ScriptItem = {}
                    objEntries(alias).reduce((acc, [key, value]) => {
                        const expandedValue = Array.isArray(value) ? value.join(' ') : value

                        // Keep original description for file jump matching
                        const originalValue = Array.isArray(value) ? JSON.stringify(value).replace(/,([^\\])/g, ', $1') : value
                        acc[key] = {
                            description: originalValue,
                            cmd:         `cargo ${expandedValue}`,
                        }

                        return acc
                    }, scripts)
                    workspaceTreeItems.push(new WorkspaceTreeItem(replaceRootPath(folder, this.workspaceRoot), scripts))
                }
                
                // metadata.scripts only makes sense in Cargo.toml
                const scripts = isCargoConfig ? undefined : toml?.workspace?.metadata?.scripts || toml?.package?.metadata?.scripts
                if (scripts) {
                    const workspaceScripts: ScriptItem = {}
                    
                    objEntries(scripts).reduce((acc, [key, value]) => {
                        acc[key] = {
                            description: value,
                            cmd:         value,
                        }

                        return acc
                    }, workspaceScripts)
                    workspaceTreeItems.push(new WorkspaceTreeItem(replaceRootPath(folder, this.workspaceRoot), workspaceScripts))
                }
            }
        })

        return workspaceTreeItems
    }

    private _getScriptsTreeItem(folder: string, scripts: ScriptItem) {
        const scriptTreeItems: ScriptTreeItem[] = []
        if (pathExists(folder)) {
            Object.keys(scripts).forEach(key => {
                scriptTreeItems.push(new ScriptTreeItem(key, scripts[key].cmd, folder, scripts[key].description))
            })
        }

        return scriptTreeItems
    }

    _showScriptTree(show: boolean) {
        vscode.commands.executeCommand('setContext', 'showCargoScript', show)
    }
}
