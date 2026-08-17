function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const SKIP_TOOL_STATUS = new Set(['pending_confirmation', 'rejected', 'skipped_exists'])

export const RECORD_OPEN_KEY = '__open'

export type RecordOpenMeta = {
  service: string
  path: string
}

export function formatDisplayValue(value: unknown): string {
  if (value == null) {
    return ''
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (isRecord(entry) ? formatRecordLines(entry).replace(/\n/g, '; ') : formatDisplayValue(entry)))
      .filter(Boolean)
      .join(', ')
  }
  if (isRecord(value)) {
    return formatRecordLines(value).replace(/\n/g, '; ')
  }
  return String(value)
}

export function formatRecordLines(record: Record<string, unknown>): string {
  return Object.entries(record)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${formatDisplayValue(value)}`)
    .join('\n')
}

function unwrapToolOutput(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }
  if (typeof value.status === 'string' && SKIP_TOOL_STATUS.has(value.status)) {
    return null
  }
  if (value.status === 'executed' && 'data' in value) {
    return value.data
  }
  return value
}

export function recordsFromUnknown(value: unknown): Record<string, unknown>[] {
  const unwrapped = unwrapToolOutput(value)
  if (unwrapped == null) {
    return []
  }
  if (Array.isArray(unwrapped)) {
    return unwrapped.filter(isRecord)
  }
  if (!isRecord(unwrapped)) {
    return []
  }
  for (const key of ['items', 'results']) {
    const nested = unwrapped[key]
    if (Array.isArray(nested)) {
      return nested.filter(isRecord)
    }
  }
  return [unwrapped]
}

function stringField(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }
  return value.trim()
}

function viewVars(
  record: Record<string, unknown>,
  args: Record<string, unknown>,
): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const source of [args, record]) {
    for (const [key, value] of Object.entries(source)) {
      const text = stringField(value)
      if (text) {
        vars[key] = text
      }
    }
  }
  const kind =
    stringField(record.kind) ??
    stringField(record.entityKind) ??
    stringField(args.kind) ??
    stringField(args.entityKind)
  if (kind) {
    vars.kind = kind
    vars.entityKind = kind
  }
  return vars
}

export function interpolateViewPath(
  template: string,
  record: Record<string, unknown>,
  args: Record<string, unknown> = {},
): string | null {
  const vars = viewVars(record, args)
  const path = template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_match, key: string) => {
    const value = vars[key]
    return value ? encodeURIComponent(value) : `{${key}}`
  })
  if (/\{[A-Za-z]/.test(path)) {
    return null
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..') || path.includes('://')) {
    return null
  }
  return path
}

export function withRecordOpen(
  records: Record<string, unknown>[],
  tool: { service: string; viewPath?: string } | undefined,
  args: Record<string, unknown> = {},
): Record<string, unknown>[] {
  if (!tool?.viewPath) {
    return records
  }
  return records.map((record) => {
    const path = interpolateViewPath(tool.viewPath as string, record, args)
    if (!path) {
      return record
    }
    return {
      ...record,
      [RECORD_OPEN_KEY]: { service: tool.service, path } satisfies RecordOpenMeta,
    }
  })
}
