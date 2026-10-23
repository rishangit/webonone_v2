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
const CANVAS_BLOCK = /\[designer-canvas\][\s\S]*?\[\/designer-canvas\]/g
const CONSTRAINT_TITLE =
  /general design|implementation requirement|expected result|accessibility|technology stack|do not modify/i

export type CanvasSectionBrief = {
  title: string
  detail: string
}

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

function cleanSectionTitle(raw: string): string {
  return raw.replace(/^\d+[.)\]]\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

function designerRequestBody(content: string): string {
  return content.replace(CANVAS_BLOCK, '').trim()
}

/** Numbered or markdown sections that should each become one canvas task. Rules and expected-result notes are omitted. */
export function canvasSectionBriefs(content: string): CanvasSectionBrief[] {
  const body = designerRequestBody(content)
  const headings = [...body.matchAll(/^(#{1,3})\s+(.+)$/gm)]
  const sections: CanvasSectionBrief[] = []
  if (headings.length >= 2) {
    const hasNested = headings.some((match) => match[1].length > 1)
    for (let index = 0; index < headings.length; index += 1) {
      const level = headings[index][1].length
      if (level === 1 && hasNested) continue
      const title = cleanSectionTitle(headings[index][2])
      if (!title || CONSTRAINT_TITLE.test(title)) continue
      const start = (headings[index].index ?? 0) + headings[index][0].length
      const end = headings[index + 1]?.index ?? body.length
      sections.push({ title, detail: body.slice(start, end).trim().slice(0, 1200) })
      if (sections.length >= MAX_TASKS) break
    }
    return sections.length >= 2 ? sections : []
  }
  for (const match of body.matchAll(/^\d+[.)\]]\s+(.+)$/gm)) {
    const title = cleanSectionTitle(match[1] ?? '')
    if (!title || CONSTRAINT_TITLE.test(title)) continue
    sections.push({ title, detail: '' })
    if (sections.length >= MAX_TASKS) break
  }
  return sections.length >= 2 ? sections : []
}

function normalizedWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 3)
}

export function taskCoversSection(title: string, sectionTitle: string): boolean {
  const section = cleanSectionTitle(sectionTitle).toLowerCase()
  const task = title.toLowerCase()
  if (!section || !task) return false
  if (task.includes(section)) return true
  const words = normalizedWords(section)
  const hits = words.filter((word) => task.includes(word))
  return words.length > 0 && hits.length >= Math.min(2, words.length)
}

export function uncoveredCanvasSections(
  drafts: { title: string }[],
  sections: CanvasSectionBrief[],
): CanvasSectionBrief[] {
  return sections.filter((section) => !drafts.some((draft) => taskCoversSection(draft.title, section.title)))
}

export function sectionCoverage(drafts: { title: string }[], sections: CanvasSectionBrief[]): number {
  return sections.length - uncoveredCanvasSections(drafts, sections).length
}

/** Split a single merged canvas call into blocks only when the brief itself has several sections. */
export function expandPlannerDrafts(
  drafts: DesignerTaskDraft[],
  sections: CanvasSectionBrief[],
): DesignerTaskDraft[] {
  if (drafts.length === 1 && sections.length >= 2) {
    const parts = splitCanvasArguments(drafts[0].arguments)
    if (parts.length > 1) return parts.slice(0, MAX_TASKS)
  }
  return drafts.slice(0, MAX_TASKS)
}

export function designerTaskPlanPrompt(
  tool: Pick<ToolDefinition, 'description' | 'jsonSchema'>,
  sections: CanvasSectionBrief[] = [],
): string {
  const lines = [
    'The user is editing an open website designer canvas. Read the request completely and list every requirement, in the order it was written.',
    'Return JSON only: {"tasks":[{"title":"short label","arguments":{"name":"short change name","operations":[]}}]}.',
    'One task per canvas section. Do not merge unrelated sections. Do not stop after the first section. At most 8 tasks. Each operations array has 1 to 24 items.',
    'Keep columns, benefits, and copy that belong to one section inside that section. Do not make a separate task for a column inside a section.',
    'A new section starts with add_block without group. Nested columns use add_block with group true, then at least two add_addon operations. Use only operations from the schema.',
    'Do not call tools.',
    `Canvas tool: ${tool.description}`,
    `Arguments schema: ${JSON.stringify(tool.jsonSchema)}`,
  ]
  if (sections.length >= 2) {
    lines.push(
      'These are the canvas sections, in order. Return exactly one task for each. Each task title must include that section title. Skip design rules and expected-result notes.',
    )
    sections.forEach((section, index) => {
      lines.push(`${index + 1}. ${section.title}`)
      if (section.detail) lines.push(section.detail)
    })
  }
  return lines.join('\n')
}

export function designerSectionRetryPrompt(missing: CanvasSectionBrief[]): string {
  const lines = [
    'The plan does not cover every canvas section. Return JSON only for the full task list, one task per section, in this order. Include sections you already planned and every section below.',
    'Each task title must include the section title. Put that section’s elements only in its operations.',
  ]
  missing.forEach((section, index) => {
    lines.push(`${index + 1}. ${section.title}`)
    if (section.detail) lines.push(section.detail)
  })
  return lines.join('\n')
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
  const lead = `I read the whole request as ${total} tasks. This is the implementation list. Confirm task ${currentIndex + 1} of ${total}.`
  return waiting
    ? `${lead} After you confirm or cancel it, the next task is prepared automatically.`
    : lead
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
