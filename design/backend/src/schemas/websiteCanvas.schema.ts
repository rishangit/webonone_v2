import { z } from 'zod'

const canvasIdSchema = z.string().trim().min(8).max(32)
const addonTypeSchema = z.enum(['text', 'button', 'image', 'slider', 'menu'])

const elementNameSchema = z.string().trim().min(1).max(64)

const addBlockOperationSchema = z.object({
  op: z.literal('add_block'),
  blockId: canvasIdSchema.optional(),
  name: elementNameSchema.optional(),
  group: z.boolean().optional(),
  span: z.enum(['full', 'half', 'third', 'quarter']).optional(),
})

const addAddonOperationSchema = z.object({
  op: z.literal('add_addon'),
  type: addonTypeSchema,
  blockId: canvasIdSchema.optional(),
  name: elementNameSchema.optional(),
  text: z.string().trim().max(4000).optional(),
  items: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  span: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  role: z.enum(['heading', 'body']).optional(),
})

const updateTextOperationSchema = z.object({
  op: z.literal('update_text'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema.optional(),
  name: elementNameSchema.optional(),
  text: z.string().trim().max(4000),
})

const updateButtonOperationSchema = z.object({
  op: z.literal('update_button'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema.optional(),
  name: elementNameSchema.optional(),
  text: z.string().trim().min(1).max(200),
})

const updateMenuOperationSchema = z.object({
  op: z.literal('update_menu'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema.optional(),
  name: elementNameSchema.optional(),
  items: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
})

const renameOperationSchema = z.object({
  op: z.literal('rename'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema.optional(),
  name: elementNameSchema,
})

const placeBlockOperationSchema = z.object({
  op: z.literal('place_block'),
  blockId: canvasIdSchema,
  align: z.enum(['start', 'center', 'end']),
})

const gridColSchema = z.number().int().min(1).max(12)
const gridSpanSchema = z.number().int().min(1).max(12)
const gridRowSchema = z.number().int().min(0).max(200)
const gridRowsSchema = z.number().int().min(1).max(80)

const moveOperationSchema = z.object({
  op: z.literal('move'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema.optional(),
  col: gridColSchema.optional(),
  row: gridRowSchema.optional(),
  cols: gridSpanSchema.optional(),
  rows: gridRowsSchema.optional(),
})

const deleteBlockOperationSchema = z.object({
  op: z.literal('delete_block'),
  blockId: canvasIdSchema,
})

const deleteAddonOperationSchema = z.object({
  op: z.literal('delete_addon'),
  blockId: canvasIdSchema.optional(),
  addonId: canvasIdSchema,
})

const CANVAS_OPS = new Set([
  'add_block',
  'add_addon',
  'update_text',
  'update_button',
  'update_menu',
  'rename',
  'place_block',
  'move',
  'delete_block',
  'delete_addon',
])

function hasGridPosition(row: Record<string, unknown>): boolean {
  return ['col', 'row', 'cols', 'rows'].some((key) => row[key] != null && row[key] !== '')
}

function addonTypeFromLabel(value: unknown): 'text' | 'button' | 'image' | 'slider' | 'menu' | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.toLowerCase()
  if (/\b(logo|image|photo|picture|icon)\b/.test(text)) return 'image'
  if (/\b(menu|navigation|nav)\b/.test(text)) return 'menu'
  if (/\bbutton\b/.test(text)) return 'button'
  if (/\b(slider|carousel)\b/.test(text)) return 'slider'
  return undefined
}

function hasMenuItems(row: Record<string, unknown>): boolean {
  return Array.isArray(row.items) && row.items.some((item) => typeof item === 'string' && item.trim())
}

const ADDON_TYPE_ALIASES = new Set(['hero', 'banner', 'photo', 'picture', 'logo', 'background'])

function canonicalOp(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''
  if (CANVAS_OPS.has(raw)) return raw
  if (
    raw === 'add_image' ||
    raw === 'insert_image' ||
    raw === 'create_image' ||
    raw === 'add_hero_image' ||
    raw === 'add_text' ||
    raw === 'insert_text' ||
    raw === 'create_text' ||
    raw === 'add_button' ||
    raw === 'insert_button' ||
    raw === 'add_menu' ||
    raw === 'insert_menu' ||
    raw === 'add_slider' ||
    raw === 'insert_slider' ||
    raw === 'add_carousel'
  ) {
    return 'add_addon'
  }
  if (raw === 'add_section' || raw === 'create_section' || raw === 'insert_section' || raw === 'add_hero' || raw === 'add_group' || raw === 'insert_group') {
    return 'add_block'
  }
  return ''
}

function typeFromOpAlias(value: unknown): 'text' | 'button' | 'image' | 'slider' | 'menu' | undefined {
  const raw = typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''
  if (raw === 'add_text' || raw === 'insert_text' || raw === 'create_text') return 'text'
  if (raw === 'add_button' || raw === 'insert_button') return 'button'
  if (raw === 'add_menu' || raw === 'insert_menu') return 'menu'
  if (raw === 'add_slider' || raw === 'insert_slider' || raw === 'add_carousel') return 'slider'
  if (raw === 'add_image' || raw === 'insert_image' || raw === 'create_image' || raw === 'add_hero_image' || /\bimage\b/.test(raw)) {
    return 'image'
  }
  return undefined
}

function phraseOperation(text: string): Record<string, unknown> | null {
  const value = text.toLowerCase()
  const image = /\b(image|photo|picture|banner)\b/.test(value)
  const section = /\b(section|block)\b/.test(value)
  const name = text.trim().slice(0, 64)
  if (image && !section) return { op: 'add_addon', type: 'image', name: name || 'Hero image', span: 'full' }
  if (section) return { op: 'add_block', name: name || 'Hero image' }
  if (/\bhero\b/.test(value)) return { op: 'add_addon', type: 'image', name: name || 'Hero image', span: 'full' }
  return null
}

function normalizeCanvasOperation(operation: unknown): unknown {
  if (typeof operation === 'string') return phraseOperation(operation) ?? operation
  if (!operation || typeof operation !== 'object' || Array.isArray(operation)) return operation
  let row = operation as Record<string, unknown>
  const rawOp = [row.op, row.operation, row.action].find((value) => typeof value === 'string')
  const declared = canonicalOp(row.op) || canonicalOp(row.operation) || canonicalOp(row.action)
  let op = declared
  const typeText = typeof row.type === 'string' ? row.type.trim().toLowerCase() : ''
  const label = typeof row.name === 'string' ? row.name : ''
  if (!op) {
    if (ADDON_TYPE_ALIASES.has(typeText) || typeText === 'image' || typeText === 'text' || typeText === 'button' || typeText === 'menu' || typeText === 'slider') {
      op = 'add_addon'
    } else if (typeText === 'section' || typeText === 'block' || typeText === 'group' || row.group === true) {
      op = 'add_block'
    } else if (/\b(image|photo|picture|banner)\b/i.test(label) && !/\b(section|block)\b/i.test(label)) {
      op = 'add_addon'
    } else if (/\b(section|block)\b/i.test(label)) {
      op = 'add_block'
    } else if (addonTypeFromLabel(label)) {
      op = 'add_addon'
    }
  }
  if (op) row = { ...row, op }
  if (typeof rawOp === 'string' && /group/.test(rawOp.toLowerCase())) row = { ...row, op: 'add_block', group: true }
  if (row.op === 'add_addon') {
    const aliased = ADDON_TYPE_ALIASES.has(typeText) ? 'image' : undefined
    const fromOp = typeFromOpAlias(rawOp)
    const named = addonTypeFromLabel(label)
    if (typeof row.type !== 'string' || !['text', 'button', 'image', 'slider', 'menu'].includes(typeText)) {
      const type =
        aliased ??
        (typeText === 'image' ? 'image' : undefined) ??
        named ??
        fromOp
      if (type) row = { ...row, type }
    }
    if ((/\bhero\b/i.test(label) || /\bhero\b/i.test(String(row.op))) && row.span == null) {
      row = { ...row, span: 'full' }
    }
  }
  return row
}

function gridField(value: unknown, key: 'col' | 'row' | 'cols' | 'rows', min: number, max: number): Record<string, number> {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  if (!Number.isFinite(number)) return {}
  return { [key]: Math.min(max, Math.max(min, Math.round(number))) }
}

/** Text and menu labels often arrive without type. Fill it so confirm can apply the canvas. */
function withInferredAddonTypes(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const body = value as { operations?: unknown }
  if (!Array.isArray(body.operations)) return value
  return {
    ...body,
    operations: body.operations.map((operation) => {
      const normalized = normalizeCanvasOperation(operation)
      if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return normalized
      let row = normalized as Record<string, unknown>
      if ((typeof row.op !== 'string' || !CANVAS_OPS.has(row.op)) && hasGridPosition(row) && (row.blockId != null || row.addonId != null)) {
        row = { ...row, op: 'move' }
      }
      if (row.op === 'rename' && typeof row.name !== 'string' && typeof row.text === 'string' && row.text.trim()) {
        return { ...row, name: row.text.trim().slice(0, 64) }
      }
      if (row.op === 'move') {
        return {
          ...row,
          ...gridField(row.col, 'col', 1, 12),
          ...gridField(row.row, 'row', 0, 200),
          ...gridField(row.cols, 'cols', 1, 12),
          ...gridField(row.rows, 'rows', 1, 80),
        }
      }
      if (row.op === 'update_menu' && !hasMenuItems(row) && row.addonId == null) {
        row = { ...row, op: 'add_addon', type: 'menu' }
      }
      if (
        row.op === 'update_text' &&
        !(typeof row.text === 'string' && row.text.trim()) &&
        row.addonId == null &&
        row.blockId == null
      ) {
        const named = addonTypeFromLabel(row.name)
        if (named) row = { ...row, op: 'add_addon', type: named }
      }
      if (row.op !== 'add_addon' || typeof row.type === 'string') return row === operation ? operation : row
      if (hasMenuItems(row)) return { ...row, type: 'menu' }
      if (typeof row.text === 'string' && row.text.trim()) return { ...row, type: 'text' }
      const named = addonTypeFromLabel(row.name)
      if (named) return { ...row, type: named }
      return row
    }),
  }
}

export const applyDesignCanvasSchema = z.preprocess(withInferredAddonTypes, z.object({
  name: z.string().trim().min(1).max(240),
  operations: z
    .array(
      z.discriminatedUnion('op', [
        addBlockOperationSchema,
        addAddonOperationSchema,
        updateTextOperationSchema,
        updateButtonOperationSchema,
        updateMenuOperationSchema,
        renameOperationSchema,
        placeBlockOperationSchema,
        moveOperationSchema,
        deleteBlockOperationSchema,
        deleteAddonOperationSchema,
      ]),
    )
    .min(1)
    .max(24),
}))

export type ApplyDesignCanvasBody = z.infer<typeof applyDesignCanvasSchema>
