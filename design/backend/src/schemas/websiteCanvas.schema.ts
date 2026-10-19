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
      if (!operation || typeof operation !== 'object' || Array.isArray(operation)) return operation
      let row = operation as Record<string, unknown>
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
      if (row.op !== 'add_addon' || typeof row.type === 'string') return operation
      const items = Array.isArray(row.items) ? row.items : []
      if (items.some((item) => typeof item === 'string' && item.trim())) return { ...row, type: 'menu' }
      if (typeof row.text === 'string' && row.text.trim()) return { ...row, type: 'text' }
      return operation
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
