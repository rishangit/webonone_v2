#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { pickFeedbackTicketForQueue } from './pickFeedbackTicket.js'
import { commandForStatus, type StatusCommandPayload } from './statusCommands.js'
import { SupportFeedbackApi, type FeedbackStatus } from './supportApi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const triggerPayloadSchema = z.object({
  ticketNumber: z.string().regex(/^\d{4}$/),
  status: z.enum([
    'todo',
    'ready_to_develop',
    'planned',
    'in_progress',
    'developed',
    'staging',
    'closed',
  ]),
  fromStatus: z
    .enum([
      'todo',
      'ready_to_develop',
      'planned',
      'in_progress',
      'developed',
      'staging',
      'closed',
    ])
    .optional(),
  id: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
})

function repoRootFromModule(): string {
  return path.resolve(__dirname, '..', '..', '..')
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx < 0) return undefined
  return process.argv[idx + 1]
}

function resolveAgentCommand(): string {
  const override = process.env.FEEDBACK_FIX_AGENT_CMD?.trim()
  if (override) return override
  return process.platform === 'win32' ? 'agent.cmd' : 'agent'
}

function secureSecretMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
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
  prompt: string
}): Promise<number> {
  const agentCmd = resolveAgentCommand()
  const args = [
    '-p',
    '--print',
    '--trust',
    '--force',
    '--approve-mcps',
    '--workspace',
    options.workspace,
    options.prompt,
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

function startMappedCommand(
  payload: StatusCommandPayload,
  config: { workspace: string; lockPath: string; logDir: string },
): { started: boolean; reason?: string; run?: Promise<number> } {
  const command = commandForStatus(payload.status)
  if (!command) {
    return { started: false, reason: `no command mapped for status ${payload.status}` }
  }

  const lock = readLock(config.lockPath)
  if (lock?.pid && isProcessAlive(lock.pid)) {
    return {
      started: false,
      reason: `agent already running for ticket ${lock.ticketNumber} (pid ${lock.pid})`,
    }
  }
  if (lock) clearLock(config.lockPath)

  const prompt = command.buildPrompt(payload)
  console.log(
    `[feedback-fix-watcher] Starting ${command.name} for ticket ${payload.ticketNumber} (${payload.status})`,
  )
  const run = runAgentOnce({
    workspace: config.workspace,
    ticketNumber: payload.ticketNumber,
    feedbackId: payload.id ?? payload.ticketNumber,
    lockPath: config.lockPath,
    logDir: config.logDir,
    prompt,
  }).then((exitCode) => {
    console.log(`[feedback-fix-watcher] Agent finished for ${payload.ticketNumber} (exit ${exitCode})`)
    return exitCode
  })

  return { started: true, run }
}

async function pollOnce(
  api: SupportFeedbackApi,
  config: { workspace: string; lockPath: string; logDir: string },
  ticketNumber?: string,
): Promise<void> {
  const lock = readLock(config.lockPath)
  if (lock?.pid && isProcessAlive(lock.pid)) {
    console.log(
      `[feedback-fix-watcher] Agent still running for ticket ${lock.ticketNumber} (pid ${lock.pid})`,
    )
    return
  }
  if (lock) clearLock(config.lockPath)

  if (ticketNumber) {
    const pick = await api.getFeedbackByTicket(ticketNumber)
    const mappedStatus: FeedbackStatus =
      pick.status === 'planned' || pick.status === 'ready_to_develop'
        ? 'ready_to_develop'
        : pick.status
    const result = startMappedCommand(
      {
        ticketNumber: pick.ticketNumber,
        status: mappedStatus,
        fromStatus: pick.status,
        id: pick.id,
        type: pick.type,
        title: pick.title,
      },
      config,
    )
    if (!result.started) {
      console.log(`[feedback-fix-watcher] Skip ticket ${ticketNumber}: ${result.reason}`)
      return
    }
    await result.run
    return
  }

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

  const result = startMappedCommand(
    {
      ticketNumber: pick.ticketNumber,
      // Poll queue includes planned (implement phase); map only has ready_to_develop.
      status: 'ready_to_develop',
      fromStatus: pick.status,
      id: pick.id,
      type: pick.type,
      title: pick.title,
    },
    config,
  )
  if (!result.started) {
    console.log(`[feedback-fix-watcher] Skip: ${result.reason}`)
    return
  }
  await result.run
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function startListener(config: { workspace: string; lockPath: string; logDir: string }): void {
  const secret = process.env.FEEDBACK_FIX_TRIGGER_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('FEEDBACK_FIX_TRIGGER_SECRET is required (min 32 chars) for --listen')
  }
  const listenPort = envInt('FEEDBACK_FIX_LISTEN_PORT', 4055)

  const server = createServer((req, res) => {
    void (async () => {
      if (req.method === 'GET' && req.url === '/health') {
        json(res, 200, { ok: true })
        return
      }
      if (req.method !== 'POST' || req.url !== '/run') {
        json(res, 404, { message: 'Not found' })
        return
      }

      const provided = req.headers['x-feedback-fix-trigger-secret']
      const headerSecret = Array.isArray(provided) ? provided[0] : provided
      if (!headerSecret || !secureSecretMatch(headerSecret, secret)) {
        json(res, 401, { message: 'Unauthorized' })
        return
      }

      let parsed: z.infer<typeof triggerPayloadSchema>
      try {
        parsed = triggerPayloadSchema.parse(JSON.parse(await readBody(req)))
      } catch {
        json(res, 400, { message: 'Invalid body' })
        return
      }

      const result = startMappedCommand(parsed, config)
      if (result.run) {
        result.run.catch((err) => {
          console.error('[feedback-fix-watcher] agent error:', err instanceof Error ? err.message : err)
        })
      }
      json(res, 202, {
        accepted: true,
        started: result.started,
        ticketNumber: parsed.ticketNumber,
        status: parsed.status,
        reason: result.reason,
      })
    })().catch((err) => {
      console.error('[feedback-fix-watcher] listen error:', err instanceof Error ? err.message : err)
      if (!res.headersSent) {
        json(res, 500, { message: 'Internal error' })
      }
    })
  })

  server.listen(listenPort, '127.0.0.1', () => {
    console.log(`[feedback-fix-watcher] listening on http://127.0.0.1:${listenPort}/run`)
  })
}

async function main(): Promise<void> {
  const workspace = process.env.FEEDBACK_FIX_WORKSPACE?.trim() || repoRootFromModule()
  const pollMs = envInt('FEEDBACK_FIX_POLL_INTERVAL_MS', 120_000)
  const lockPath =
    process.env.FEEDBACK_FIX_LOCK_PATH?.trim() ||
    path.join(workspace, '.cursor', 'feedback-fix-watcher.lock')
  const logDir =
    process.env.FEEDBACK_FIX_LOG_DIR?.trim() ||
    path.join(workspace, '.cursor', 'logs', 'feedback-fix-watcher')
  const config = { workspace, lockPath, logDir }

  const listen = process.argv.includes('--listen')
  const once = process.argv.includes('--once')
  const ticketNumber = argValue('--ticket')

  if (listen) {
    console.log(`[feedback-fix-watcher] workspace=${workspace} lock=${lockPath}`)
    startListener(config)
    return
  }

  const api = SupportFeedbackApi.fromEnv()
  console.log(
    `[feedback-fix-watcher] workspace=${workspace} poll=${pollMs}ms once=${once} ticket=${ticketNumber ?? '-'} lock=${lockPath}`,
  )

  if (once || ticketNumber) {
    await pollOnce(api, config, ticketNumber)
    return
  }

  for (;;) {
    try {
      await pollOnce(api, config)
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
