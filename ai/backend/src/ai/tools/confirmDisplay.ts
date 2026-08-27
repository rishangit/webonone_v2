import { completeCreateArgs } from './createDefaults.js'
import { requiredCreateKeys } from './extractCreateItems.js'
import { filterApplicableConfirmKeys } from './schemaMatch.js'
import type { ToolDefinition, ToolRole } from './registry.js'

export const MISSING_DISPLAY_VALUE = '—'

export function isHiddenConfirmKey(key: string): boolean {
  return key === 'id' || /_ids?$/i.test(key)
}

export type ConfirmDisplayField = {
  key: string
  label: string
  value: string
  missing: boolean
  editable: boolean
  inputType: 'text' | 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

function schemaProperties(schema: Record<string, unknown>): Record<string, unknown> {
  return isRecord(schema.properties) ? schema.properties : {}
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function propertyLabel(key: string, prop: unknown): string {
  if (isRecord(prop) && typeof prop.title === 'string' && prop.title.trim()) {
    return prop.title.trim()
  }
  return humanizeKey(key)
}

function propertyInputType(prop: unknown): 'text' | 'number' {
  if (!isRecord(prop)) {
    return 'text'
  }
  if (prop.type === 'integer' || prop.type === 'number') {
    return 'number'
  }
  return 'text'
}

function isScalarProperty(prop: unknown): boolean {
  if (!isRecord(prop)) {
    return false
  }
  const type = prop.type
  if (type === 'string' || type === 'integer' || type === 'number' || type === 'boolean') {
    return true
  }
  return Array.isArray(prop.enum) && prop.enum.length > 0
}

function isEditableConfirmProperty(prop: unknown): boolean {
  if (!isRecord(prop)) {
    return false
  }
  if (prop.type === 'integer' || prop.type === 'number') {
    return true
  }
  if (prop.type === 'string' && !Array.isArray(prop.enum)) {
    return true
  }
  return false
}

function formatScalarValue(value: unknown): string {
  if (value === undefined || value === null) {
    return MISSING_DISPLAY_VALUE
  }
  if (typeof value === 'string' && !value.trim()) {
    return MISSING_DISPLAY_VALUE
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value)
}

function scalarDisplayKeys(
  tool: Pick<ToolDefinition, 'jsonSchema' | 'relatedArgs' | 'argCompletion'>,
  args: Record<string, unknown>,
): string[] {
  const props = schemaProperties(tool.jsonSchema)
  const relatedKeys = new Set(
    (tool.relatedArgs ?? []).flatMap((spec) => [spec.argKey, spec.displayKey]),
  )
  const ordered = [...requiredCreateKeys(tool)]
  for (const key of Object.keys(props)) {
    if (!ordered.includes(key)) {
      ordered.push(key)
    }
  }
  const scalarKeys = ordered.filter((key) => {
    if (isHiddenConfirmKey(key) || relatedKeys.has(key)) {
      return false
    }
    const prop = props[key]
    return isScalarProperty(prop)
  })
  return filterApplicableConfirmKeys(tool.jsonSchema, args, scalarKeys)
}

export function buildConfirmDisplayFields(
  tool: Pick<ToolDefinition, 'jsonSchema' | 'relatedArgs' | 'argCompletion'> & { name?: string },
  args: Record<string, unknown>,
  options?: { editable?: boolean; role?: ToolRole; omitMissing?: boolean },
): ConfirmDisplayField[] {
  const role = options?.role ?? 'member'
  const displayArgs = completeCreateArgs(
    { name: tool.name ?? 'confirm-display', jsonSchema: tool.jsonSchema, argCompletion: tool.argCompletion },
    args,
    role,
  )
  const props = schemaProperties(tool.jsonSchema)
  const allowEdit = options?.editable !== false
  const presentArgKeys = new Set(
    Object.keys(args).filter((key) => !isHiddenConfirmKey(key) && isPresent(args[key])),
  )
  const fields = scalarDisplayKeys(tool, displayArgs).map((key) => {
    const prop = props[key]
    const raw = displayArgs[key]
    const missing = !isPresent(raw)
    return {
      key,
      label: propertyLabel(key, prop),
      value: formatScalarValue(raw),
      missing,
      editable: allowEdit && missing && isEditableConfirmProperty(prop),
      inputType: propertyInputType(prop),
    }
  })
  if (options?.omitMissing) {
    return fields.filter((field) => presentArgKeys.has(field.key))
  }
  return fields
}

export function displayRecordFromFields(fields: ConfirmDisplayField[]): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const field of fields) {
    next[field.key] = field.value
  }
  return next
}
