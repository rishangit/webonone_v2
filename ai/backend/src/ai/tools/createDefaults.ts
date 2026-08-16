import type { ToolDefinition, ToolRole } from './registry.js'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

const GENERIC_COLOR_PALETTE = [
  '#2563EB',
  '#16A34A',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

export function pickHexColor(
  palette: readonly string[],
  random: () => number = Math.random,
): string {
  if (palette.length === 0) {
    return GENERIC_COLOR_PALETTE[0]
  }
  const index = Math.floor(random() * palette.length)
  return palette[index] ?? GENERIC_COLOR_PALETTE[0]
}

function hexEnum(prop: unknown): string[] | null {
  if (!isRecord(prop) || !Array.isArray(prop.enum) || prop.enum.length === 0) {
    return null
  }
  const values = prop.enum.filter((item): item is string => typeof item === 'string' && HEX_COLOR.test(item))
  return values.length === prop.enum.length ? values : null
}

function isColorProperty(name: string, prop: unknown): boolean {
  return name === 'color' || hexEnum(prop) != null
}

function inPalette(value: string, palette: readonly string[]): boolean {
  const upper = value.toUpperCase()
  return palette.some((color) => color.toUpperCase() === upper)
}

function schemaProperties(schema: Record<string, unknown>): Record<string, unknown> {
  return isRecord(schema.properties) ? schema.properties : {}
}

export function missingRequiredArgs(
  schema: Record<string, unknown>,
  args: Record<string, unknown>,
): string[] {
  const required = Array.isArray(schema.required)
    ? schema.required.filter((key): key is string => typeof key === 'string')
    : []
  return required.filter((key) => !isPresent(args[key]))
}

export function completeCreateArgs(
  tool: Pick<ToolDefinition, 'name' | 'jsonSchema' | 'argCompletion'>,
  args: Record<string, unknown>,
  role: ToolRole,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...args }
  const completion = tool.argCompletion

  if (completion?.defaults) {
    for (const [key, value] of Object.entries(completion.defaults)) {
      if (!isPresent(next[key])) {
        next[key] = value
      }
    }
  }

  for (const [key, prop] of Object.entries(schemaProperties(tool.jsonSchema))) {
    if (!isColorProperty(key, prop)) {
      continue
    }
    const allowed = hexEnum(prop)
    const palette = allowed ?? GENERIC_COLOR_PALETTE
    const current = asString(next[key])
    if (!current || !HEX_COLOR.test(current) || (allowed && !inPalette(current, allowed))) {
      next[key] = pickHexColor(palette)
    }
  }

  const forced = completion?.forceByRole?.[role]
  if (forced) {
    Object.assign(next, forced)
  }

  if (completion?.allowedKeys) {
    const allowed = new Set(completion.allowedKeys)
    for (const key of Object.keys(next)) {
      if (!allowed.has(key)) {
        delete next[key]
      }
    }
  }

  return next
}
