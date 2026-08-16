import { ItemList, ItemListContent, ItemListItem } from '@webonone/ui-kit'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

export function parseRecordsFromText(content: string): Record<string, unknown>[] {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (Array.isArray(parsed)) {
      return parsed.filter(isRecord)
    }
    if (!isRecord(parsed)) {
      return []
    }
    for (const key of ['items', 'results']) {
      const nested = parsed[key]
      if (Array.isArray(nested)) {
        return nested.filter(isRecord)
      }
    }
    return [parsed]
  } catch {
    return []
  }
}

export function visibleAssistantText(content: string, records: Record<string, unknown>[]): string {
  if (records.length === 0) {
    return content
  }
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return content
  }
  try {
    JSON.parse(trimmed)
    return ''
  } catch {
    return content
  }
}

export function RecordLines({ record }: { record: Record<string, unknown> }) {
  return (
    <div className="space-y-0.5 text-xs">
      {Object.entries(record)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => (
          <p key={key} className="whitespace-pre-wrap break-words">
            <span className="text-muted-foreground">{key}:</span>
            {formatDisplayValue(value)}
          </p>
        ))}
    </div>
  )
}

export function RecordResultList({ records }: { records: Record<string, unknown>[] }) {
  if (records.length === 0) {
    return null
  }
  return (
    <ItemList>
      {records.map((record, index) => (
        <ItemListItem key={typeof record.id === 'string' ? record.id : `record-${index}`}>
          <ItemListContent>
            <RecordLines record={record} />
          </ItemListContent>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
