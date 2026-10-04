import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type CursorAgentSpawn = {
  command: string
  prefixArgs: string[]
}

function parseVersionSortKey(name: string): number {
  const datePart = name.split('-')[0]
  const parts = datePart.split('.')
  if (parts.length !== 3) return 0
  const year = parts[0]
  const month = parts[1].padStart(2, '0')
  const day = parts[2].padStart(2, '0')
  return Number.parseInt(`${year}${month}${day}`, 10)
}

function latestCursorAgentVersionDir(versionsDir: string): string | null {
  if (!fs.existsSync(versionsDir)) return null
  const names = fs
    .readdirSync(versionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) =>
      /^\d{4}\.\d{1,2}\.\d{1,2}(-\d{2}-\d{2}-\d{2})?-[a-f0-9]+$/i.test(name),
    )
    .sort((a, b) => parseVersionSortKey(b) - parseVersionSortKey(a))
  return names[0] ?? null
}

/**
 * Spawn Cursor CLI without cmd.exe (avoids broken multi-arg + shell on Windows).
 * Uses cursor-agent's bundled node.exe + index.js when present.
 */
export function resolveCursorAgentSpawn(): CursorAgentSpawn {
  const override = process.env.FEEDBACK_FIX_AGENT_CMD?.trim()
  if (override) {
    return { command: override, prefixArgs: [] }
  }

  const agentRoot = path.join(os.homedir(), 'AppData', 'Local', 'cursor-agent')
  const versionsDir = path.join(agentRoot, 'versions')
  const versionName = latestCursorAgentVersionDir(versionsDir)
  if (versionName) {
    const nodePath = path.join(versionsDir, versionName, 'node.exe')
    const indexPath = path.join(versionsDir, versionName, 'index.js')
    if (fs.existsSync(nodePath) && fs.existsSync(indexPath)) {
      return { command: nodePath, prefixArgs: [indexPath] }
    }
  }

  const localNode = path.join(agentRoot, 'node.exe')
  const localIndex = path.join(agentRoot, 'index.js')
  if (fs.existsSync(localNode) && fs.existsSync(localIndex)) {
    return { command: localNode, prefixArgs: [localIndex] }
  }

  return {
    command: process.platform === 'win32' ? 'agent.cmd' : 'agent',
    prefixArgs: [],
  }
}
