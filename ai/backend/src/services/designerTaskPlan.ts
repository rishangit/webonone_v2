import type { ToolDefinition } from '../ai/tools/registry.js'

export type DesignerTaskDraft = {
  title: string
  arguments: { name: string; operations: Record<string, unknown>[] }
}

export type DesignerTaskStatus = 'queued' | 'pending_confirmation' | 'confirmed' | 'rejected'

export type DesignerTaskRecord = {
  id: string
  title: string
  toolName: string
  status: DesignerTaskStatus
  arguments: Record<string, unknown>
}

const MAX_TASKS = 8
const MAX_OPERATIONS = 24
const CANVAS_TOOLS = new Set(['apply_design_canvas', 'apply_design_library_canvas'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function preserveLayoutName(name: string): boolean {
  return /\b(header|hero|banner)\b/i.test(name)
}

function titleForOperations(ops: Record<string, unknown>[], fallback: string): string {
  const block = ops.find((op) => op.op === 'add_block')
  const blockName = typeof block?.name === 'string' ? block.name.trim() : ''
  const addonNames = ops
    .filter((op) => op.op === 'add_addon')
    .map((op) => {
      if (typeof op.name === 'string' && op.name.trim()) return op.name.trim()
      return typeof op.type === 'string' ? op.type : ''
    })
    .filter(Boolean)
  if (blockName && addonNames.length > 0) return `Add ${blockName}: ${addonNames.join(', ')}`.slice(0, 240)
  if (blockName) return `Add ${blockName}`.slice(0, 240)
  if (addonNames.length > 0) return `Add ${addonNames.join(', ')}`.slice(0, 240)
  return (fallback || 'Update the canvas').slice(0, 240)
}

/** One task per new block, so a multi-part layout is not confirmed as a single batch. */
export function splitCanvasArguments(args: {
  name: string
  operations: Record<string, unknown>[]
}): DesignerTaskDraft[] {
  const operations = args.operations.filter(isRecord)
  if (operations.length === 0) return []
  const groups: Record<string, unknown>[][] = []
  let current: Record<string, unknown>[] = []
  for (const op of operations) {
    if (op.op === 'add_block' && current.length > 0) {
      groups.push(current)
      current = [op]
      continue
    }
    current.push(op)
  }
  if (current.length > 0) groups.push(current)
  if (groups.length === 1) {
    return [{ title: args.name, arguments: { name: args.name, operations } }]
  }
  return groups.slice(0, MAX_TASKS).map((ops) => {
    const title = titleForOperations(ops, args.name)
    return {
      title,
      arguments: {
        name: preserveLayoutName(args.name) ? args.name : title,
        operations: ops,
      },
    }
  })
}

export function designerTaskPlanPrompt(tool: Pick<ToolDefinition, 'description' | 'jsonSchema'>): string {
  return [
    'The user is editing an open website designer canvas. Read the request completely and list every requirement, in the order it was written.',
    'Return JSON only: {"tasks":[{"title":"short label","arguments":{"name":"short change name","operations":[]}}]}.',
    'One task per requirement. Do not merge unrelated requirements. Do not stop after the first requirement. At most 8 tasks. Each operations array has 1 to 24 items.',
    'Do not call tools.',
    `Canvas tool: ${tool.description}`,
    `Arguments schema: ${JSON.stringify(tool.jsonSchema)}`,
  ].join('\n')
}

export function parseDesignerTaskPlan(content: string): DesignerTaskDraft[] | null {
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return null
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.tasks)) return null
  const drafts: DesignerTaskDraft[] = []
  for (const entry of parsed.tasks) {
    if (!isRecord(entry)) continue
    const title = typeof entry.title === 'string' ? entry.title.trim() : ''
    const args = isRecord(entry.arguments) ? entry.arguments : null
    if (!title || !args || !Array.isArray(args.operations)) continue
    const operations = args.operations.filter(isRecord).slice(0, MAX_OPERATIONS)
    if (operations.length === 0) continue
    const name = typeof args.name === 'string' && args.name.trim() ? args.name.trim() : title
    drafts.push({
      title: title.slice(0, 240),
      arguments: { name: name.slice(0, 240), operations },
    })
    if (drafts.length >= MAX_TASKS) break
  }
  return drafts.length > 0 ? drafts : null
}

export function planFromCanvasCalls(
  calls: { name: string; arguments: Record<string, unknown> }[],
): { toolName: string; drafts: DesignerTaskDraft[] } | null {
  const drafts: DesignerTaskDraft[] = []
  let toolName = ''
  for (const call of calls) {
    if (!CANVAS_TOOLS.has(call.name)) continue
    if (!toolName) toolName = call.name
    const name = typeof call.arguments.name === 'string' && call.arguments.name.trim()
      ? call.arguments.name.trim()
      : 'Update the canvas'
    const operations = Array.isArray(call.arguments.operations)
      ? call.arguments.operations.filter(isRecord)
      : []
    if (operations.length === 0) continue
    drafts.push(...splitCanvasArguments({ name, operations }))
  }
  if (!toolName || drafts.length <= 1) return null
  return { toolName, drafts: drafts.slice(0, MAX_TASKS) }
}

export function stageDesignerTasks(toolName: string, drafts: DesignerTaskDraft[], ids: string[]): DesignerTaskRecord[] | null {
  if (drafts.length <= 1 || ids.length < drafts.length) return null
  return drafts.map((draft, index) => ({
    id: ids[index] ?? '',
    title: draft.title,
    toolName,
    status: index === 0 ? 'pending_confirmation' : 'queued',
    arguments: draft.arguments,
  }))
}

export function designerTaskIntro(tasks: { status: string }[]): string {
  const total = tasks.length
  if (total <= 1) return 'I can change this after you confirm.'
  const currentIndex = tasks.findIndex((task) => task.status === 'pending_confirmation')
  if (currentIndex < 0) return `Finished ${total} tasks. Save the canvas to keep the changes.`
  const waiting = tasks.some((task) => task.status === 'queued')
  const lead = `I read the whole request as ${total} tasks. Confirm task ${currentIndex + 1} of ${total}.`
  return waiting ? `${lead} The next task waits until you confirm or cancel this one.` : lead
}

export function parseDesignerTaskRecords(raw: unknown): DesignerTaskRecord[] | null {
  if (!Array.isArray(raw)) return null
  const tasks: DesignerTaskRecord[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.title !== 'string') continue
    if (typeof entry.toolName !== 'string' || !CANVAS_TOOLS.has(entry.toolName)) continue
    if (
      entry.status !== 'queued' &&
      entry.status !== 'pending_confirmation' &&
      entry.status !== 'confirmed' &&
      entry.status !== 'rejected'
    ) {
      continue
    }
    if (!isRecord(entry.arguments)) continue
    tasks.push({
      id: entry.id,
      title: entry.title,
      toolName: entry.toolName,
      status: entry.status,
      arguments: entry.arguments,
    })
  }
  return tasks.length > 0 ? tasks : null
}

export function rejectRemainingDesignerTasks(tasks: DesignerTaskRecord[]): DesignerTaskRecord[] {
  return tasks.map((task) =>
    task.status === 'queued' || task.status === 'pending_confirmation' ? { ...task, status: 'rejected' } : task,
  )
}

/** Mark the finished task, then promote the next queued task only when nothing is still pending. */
export function advanceDesignerTaskRecords(
  tasks: DesignerTaskRecord[],
  completedId: string,
  status: 'confirmed' | 'rejected',
): { tasks: DesignerTaskRecord[]; next: DesignerTaskRecord | null } {
  const marked = tasks.map((task) => (task.id === completedId ? { ...task, status } : task))
  if (marked.some((task) => task.status === 'pending_confirmation')) {
    return { tasks: marked, next: null }
  }
  const queued = marked.find((task) => task.status === 'queued')
  if (!queued) return { tasks: marked, next: null }
  const next = { ...queued, status: 'pending_confirmation' as const }
  return {
    tasks: marked.map((task) => (task.id === queued.id ? next : task)),
    next,
  }
}
