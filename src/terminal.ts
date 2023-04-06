import path from 'path'
import * as vscode from 'vscode'

const terminals = new Map()

vscode.window.onDidCloseTerminal((terminal) => {
  if (terminals.has(terminal.name)) {
    terminals.delete(terminal.name)
  }
})

export function executeCommand(cmd: string, label: string, cwd: string) {
  let terminal: vscode.Terminal
  const separate = vscode.workspace.getConfiguration().get('cargoScripts.terminal')
  const terminalName = separate ? `${path.basename(cwd)}: ${label}` : path.basename(cwd)
  const terminalOptions: vscode.TerminalOptions = {
    name: terminalName,
    cwd,
    hideFromUser: false,
  }
  if (terminals.has(terminalName)) {
    terminal = terminals.get(terminalName)
  }
  else {
    terminal = vscode.window.createTerminal(terminalOptions)
    terminals.set(terminalName, terminal)
  }

  terminal.show()
  terminal.sendText(cmd)
}