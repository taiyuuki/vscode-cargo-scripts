import * as vscode from 'vscode'
import * as fs from 'fs'
import { ScriptTreeItem, WorkspaceTreeItem } from './treeItem'
import { getTomlPath } from './utils'
import tomlParser from 'toml'

export class CargoScriptsTree implements vscode.TreeDataProvider<ScriptTreeItem | WorkspaceTreeItem> {
  private readonly _onChangeTreeData = new vscode.EventEmitter<ScriptTreeItem | undefined>()
  public readonly onDidChangeTreeData = this._onChangeTreeData.event

  constructor(private readonly workspaceRoot: string) {
    this.folders?.forEach(folder => {
      const pattern: string = getTomlPath(folder.uri.fsPath)
      if (this.pathExists(pattern)) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern)
        watcher.onDidChange(() => {
          this._onChangeTreeData.fire(void 0)
          vscode.commands.executeCommand('setContext', 'showCargoScript', true)
        })
      }
    })
  }

  get folders() {
    return vscode.workspace.workspaceFolders
  }

  getTreeItem(element: ScriptTreeItem | WorkspaceTreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: ScriptTreeItem | WorkspaceTreeItem): Thenable<(ScriptTreeItem | WorkspaceTreeItem)[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([])
    }
    if (element) {
      const folder = this.folders?.find(o => o.name === element.label)
      const path = folder?.uri.fsPath
      if (path) {
        return Promise.resolve(this.getScriptsTreeItem(path))
      }
      else {
        return Promise.resolve([])
      }
    }
    else {
      const cargoTomlPath = getTomlPath(this.workspaceRoot)
      if (this.pathExists(cargoTomlPath)) {
        if (this.folders?.length) {
          return Promise.resolve(this.getWorkspaceTree())
        }
        else {
          return Promise.resolve([])
        }
      }
      else {
        return Promise.resolve([])
      }
    }
  }

  private getWorkspaceTree() {
    const workspaceTreeItems: WorkspaceTreeItem[] = []
    this.folders?.forEach(folder => {
      const folderName = folder.name
      if (folderName === 'target') {
        return
      }
      const root = folder.uri.fsPath
      const tomlPath = getTomlPath(root)
      if (this.pathExists(tomlPath)) {
        workspaceTreeItems.push(new WorkspaceTreeItem(folderName))
      }
    })
    return workspaceTreeItems
  }

  private getScriptsTreeItem(path: string) {
    const tomlPath = getTomlPath(path ?? this.workspaceRoot)
    const scriptTreeItems: ScriptTreeItem[] = []
    if (this.pathExists(tomlPath)) {
      const text = fs.readFileSync(tomlPath, 'utf-8')
      const toml = tomlParser.parse(text)
      const scripts = toml?.package?.metadata?.scripts
      if (scripts) {
        Object.keys(scripts).forEach(key => {
          scriptTreeItems.push(new ScriptTreeItem(key, scripts[key], tomlPath))
        })
      }
      else {
        vscode.commands.executeCommand('setContext', 'showCargoScript', false)
      }
    }
    return scriptTreeItems
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    }
    catch (err) {
      return false
    }
    return true
  }
}