import * as fs from 'node:fs'
import { join } from 'node:path'
import * as vscode from 'vscode'
import { parse } from '@iarna/toml'
import fg from 'fast-glob'
import type { ScriptItem } from './treeItem'
import { ScriptTreeItem, WorkspaceTreeItem } from './treeItem'
import { objEntries, pathExists, replaceRootPath } from './utils'

export class CargoScriptsTree implements vscode.TreeDataProvider<ScriptTreeItem | WorkspaceTreeItem> {
    private readonly _onChangeTreeData = new vscode.EventEmitter<ScriptTreeItem | undefined>()
    public readonly onDidChangeTreeData = this._onChangeTreeData.event
    private folders: string[]
    valid: boolean[]

    constructor(private readonly workspaceRoot: string) {
        this.valid = []
        this.folders = this._getFolders()
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.workspaceRoot, '{**/Cargo.toml,**/.cargo/config.toml,**/.cargo/config}'))
        watcher.onDidChange(this.emitDataChange.bind(this))
        vscode.commands.executeCommand('setContext', 'showCargoScript', true)
    }

    _getFolders() {
        return fg.sync(['**/Cargo.toml', '**/.cargo/config.toml', '**/.cargo/config'], {
            cwd: this.workspaceRoot,
            ignore: ['target', 'node_modules', 'dist', 'src'],
            caseSensitiveMatch: false,
        }).map(folder => join(this.workspaceRoot, folder))
    }

    emitDataChange(e?: vscode.Uri) {
        if (e?.fsPath && !this.folders.includes(e.fsPath)) {
            this.folders = this._getFolders()
        }
        if (!this.valid.includes(false)) {
            this._showScriptTree(true)
        }
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
        this.valid = []
        this.folders.forEach(folder => {
            if (pathExists(folder)) {
                const text = fs.readFileSync(folder, 'utf-8')
                const toml = parse(text) as Record<string, any>
                const alias = toml?.alias
                if(alias) {
                    const scripts: ScriptItem = {}
                    objEntries(alias).reduce((acc, [key, value]) => {
                        acc[key] = {
                            description: Array.isArray(value) ? JSON.stringify(value).replace(/,([^\\])/g, ', $1') : value,
                            cmd: `cargo ${key}`,
                        }

                        return acc
                    }, scripts)
                    workspaceTreeItems.push(new WorkspaceTreeItem(replaceRootPath(folder, this.workspaceRoot), scripts))
                }
                
                const scripts = toml?.workspace?.metadata?.scripts || toml?.package?.metadata?.scripts
                if (scripts) {
                    const workspaceScripts: ScriptItem = {}
                    
                    objEntries(scripts).reduce((acc, [key, value]) => {
                        acc[key] = {
                            description: value,
                            cmd: value,
                        }

                        return acc
                    }, workspaceScripts)
                    workspaceTreeItems.push(new WorkspaceTreeItem(replaceRootPath(folder, this.workspaceRoot), workspaceScripts))
                }

                if (alias || scripts) {
                    this.valid.push(false)
                }
                else {
                    this.valid.push(true)
                }
            }
        })

        if (!this.valid.includes(false)) {
            this._showScriptTree(false)
        }

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
