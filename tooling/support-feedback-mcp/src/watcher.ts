#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pickFeedbackTicketForQueue } from './pickFeedbackTicket.js'
import { SupportFeedbackApi } from './supportApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function repoRootFromModule(): string {
  return path.resolve(__dirname, '..', '..', '..')
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function resolveAgentCommand(): string {
  const override = process.env.FEEDBACK_FIX_AGENT_CMD?.trim()
  if (override) return override
  return process.platform === 'win32' ? 'agent.cmd' : 'agent'
}

function buildAgentPrompt(ticketNumber: string): string {
  return [
    `/feedback-fix ${ticketNumber}`,
    '',
    'Follow `.cursor/commands/feedback-fix.md` and `.cursor/skills/feedback-fix/SKILL.md`.',
    'Run end-to-end without asking for confirmation unless blocked.',
    'Use Support Feedback MCP for list/get/update status.',
  ].join('\n')
}

interface LockState {
  pid: number
  ticketNumber: string
  feedbackId: string
  startedAt: string
}

function readLock(lockPath: string): LockState | null {
  try {
    const raw = fs.readFileSync(lockPath, 'utf8')
    return JSON.parse(raw) as LockState
  } catch {
    return null
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function writeLock(lockPath: string, state: LockState): void {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true })
  fs.writeFileSync(lockPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function clearLock(lockPath: string): void {
  try {
    fs.unlinkSync(lockPath)
  } catch {
    /* ignore */
  }
}

function runAgentOnce(options: {
  workspace: string
  ticketNumber: string
  lockPath: string
  feedbackId: string
  logDir: string
}): Promise<number> {
  const agentCmd = resolveAgentCommand()
  const prompt = buildAgentPrompt(options.ticketNumber)
  const args = [
    '-p',
    '--print',
    '--trust',
    '--force',
    '--approve-mcps',
    '--workspace',
    options.workspace,
    prompt,
  ]

  fs.mkdirSync(options.logDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logPath = path.join(options.logDir, `feedback-fix-${options.ticketNumber}-${stamp}.log`)

  return new Promise((resolve, reject) => {
    const logStream = fs.createWriteStream(logPath, { flags: 'a' })
    logStream.write(`--- feedback-fix watcher ${new Date().toISOString()} ---\n`)
    logStream.write(`command: ${agentCmd} ${args.slice(0, -1).join(' ')} <prompt>\n\n`)

    const child = spawn(agentCmd, args, {
      cwd: options.workspace,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    if (!child.pid) {
      logStream.end()
      reject(new Error('Failed to start Cursor agent'))
      return
    }

    writeLock(options.lockPath, {
      pid: child.pid,
      ticketNumber: options.ticketNumber,
      feedbackId: options.feedbackId,
      startedAt: new Date().toISOString(),
    })

    child.stdout?.pipe(logStream)
    child.stderr?.pipe(logStream)

    child.on('error', (err) => {
      logStream.end()
      clearLock(options.lockPath)
      reject(err)
    })

    child.on('close', (code) => {
      logStream.write(`\n--- exit code ${code ?? 'null'} ---\n`)
      logStream.end()
      clearLock(options.lockPath)
      resolve(code ?? 1)
    })
  })
}

async function pollOnce(api: SupportFeedbackApi, config: {
  workspace: string
  lockPath: string
  logDir: string
}): Promise<void> {
  const lock = readLock(config.lockPath)
  if (lock?.pid && isProcessAlive(lock.pid)) {
    console.log(
      `[feedback-fix-watcher] Agent still running for ticket ${lock.ticketNumber} (pid ${lock.pid})`,
    )
    return
  }
  if (lock) clearLock(config.lockPath)

  const inProgress = await api.listFeedback({ status: 'in_progress', pageSize: 100 })
  if (inProgress.items.length > 0) {
    const active = inProgress.items[0]
    console.log(
      `[feedback-fix-watcher] Skipping poll: ${inProgress.items.length} report(s) in_progress (e.g. ${active.ticketNumber})`,
    )
    return
  }

  const pick = await pickFeedbackTicketForQueue(api)
  if (!pick) {
    console.log('[feedback-fix-watcher] No feedback in ready_to_develop or planned')
    return
  }

  console.log(
    `[feedback-fix-watcher] Starting agent for ticket ${pick.ticketNumber} (${pick.status}) — ${pick.title}`,
  )

  const exitCode = await runAgentOnce({
    workspace: config.workspace,
    ticketNumber: pick.ticketNumber,
    feedbackId: pick.id,
    lockPath: config.lockPath,
    logDir: config.logDir,
  })

  console.log(`[feedback-fix-watcher] Agent finished for ${pick.ticketNumber} (exit ${exitCode})`)
}

async function main(): Promise<void> {
  const api = SupportFeedbackApi.fromEnv()
  const workspace = process.env.FEEDBACK_FIX_WORKSPACE?.trim() || repoRootFromModule()
  const pollMs = envInt('FEEDBACK_FIX_POLL_INTERVAL_MS', 120_000)
  const lockPath =
    process.env.FEEDBACK_FIX_LOCK_PATH?.trim() ||
    path.join(workspace, '.cursor', 'feedback-fix-watcher.lock')
  const logDir =
    process.env.FEEDBACK_FIX_LOG_DIR?.trim() ||
    path.join(workspace, '.cursor', 'logs', 'feedback-fix-watcher')

  const once = process.argv.includes('--once')

  console.log(
    `[feedback-fix-watcher] workspace=${workspace} poll=${pollMs}ms once=${once} lock=${lockPath}`,
  )

  if (once) {
    await pollOnce(api, { workspace, lockPath, logDir })
    return
  }

  for (;;) {
    try {
      await pollOnce(api, { workspace, lockPath, logDir })
    } catch (err) {
      console.error('[feedback-fix-watcher] poll error:', err instanceof Error ? err.message : err)
    }
    await new Promise((r) => setTimeout(r, pollMs))
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
