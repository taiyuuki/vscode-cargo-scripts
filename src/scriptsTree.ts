import * as vscode from 'vscode'
import * as fs from 'fs'
import { ScriptTreeItem, WorkspaceTreeItem } from './treeItem'
import { replaceRootPath } from './utils'
import tomlParser from 'toml'
import fg from 'fast-glob'
import { join } from 'path'

export class CargoScriptsTree implements vscode.TreeDataProvider<ScriptTreeItem | WorkspaceTreeItem> {
  private readonly _onChangeTreeData = new vscode.EventEmitter<ScriptTreeItem | undefined>()
  public readonly onDidChangeTreeData = this._onChangeTreeData.event
  private folders: string[]
  valid: boolean[]

  constructor(private readonly workspaceRoot: string) {
    this.valid = []
    this.folders = this._getFolders()
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.workspaceRoot, '**/Cargo.toml'))
    watcher.onDidChange(this.emitDataChange.bind(this))
    vscode.commands.executeCommand('setContext', 'showCargoScript', true)
  }

  _getFolders() {
    return fg.sync(['**/Cargo.toml'], {
      cwd: this.workspaceRoot,
      ignore: ['target', 'node_modules', 'dist', 'src'],
      caseSensitiveMatch: false,
    }).map(folder => join(this.workspaceRoot, folder))
  }

  emitDataChange() {
    this.folders = this._getFolders()
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
      const path = this.folders.find(folder => replaceRootPath(folder, this.workspaceRoot)  === element.label)
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
      if (this._pathExists(folder)) {
        const text = fs.readFileSync(folder, 'utf-8')
        const toml = tomlParser.parse(text)
        const scripts = toml?.package?.metadata?.scripts
        if (scripts) {
          workspaceTreeItems.push(new WorkspaceTreeItem(replaceRootPath(folder, this.workspaceRoot), scripts))
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

  private _getScriptsTreeItem(folder: string, scripts: Record<string, string>) {
    const scriptTreeItems: ScriptTreeItem[] = []
    if (this._pathExists(folder)) {
      Object.keys(scripts).forEach(key => {
        scriptTreeItems.push(new ScriptTreeItem(key, scripts[key], folder))
      })
    }
    return scriptTreeItems
  }

  private _pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    }
    catch (err) {
      return false
    }
    return true
  }

  _showScriptTree(show: boolean) {
    vscode.commands.executeCommand('setContext', 'showCargoScript', show)
  }
}