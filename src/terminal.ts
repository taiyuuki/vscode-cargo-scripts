import path from 'path'
import * as vscode from 'vscode'

export function executeCommand(cmd: string, label: string, cwd: string) {
  let terminal: vscode.Terminal
  const separate = vscode.workspace.getConfiguration().get('cargoScripts.terminal')
  const terminalName = separate ? `${path.basename(cwd)}: ${label}` : path.basename(cwd)
  const findTerminal = vscode.window.terminals.find(ter => {
    return ter.name === terminalName
  })
  if (findTerminal) {
    terminal = findTerminal
  }
  else {
    const terminalOptions: vscode.TerminalOptions = {
      name: terminalName,
      cwd,
      hideFromUser: true,
      iconPath: new vscode.ThemeIcon('tools'),
    }

    terminal = vscode.window.createTerminal(terminalOptions)
  }

  terminal.show()
  terminal.sendText(cmd)
}