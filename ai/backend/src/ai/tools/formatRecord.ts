function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const SKIP_TOOL_STATUS = new Set(['pending_confirmation', 'rejected', 'skipped_exists'])

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
