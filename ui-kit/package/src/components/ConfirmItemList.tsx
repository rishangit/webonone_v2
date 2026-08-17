import { Button } from './Button'
import { ItemList, ItemListContent, ItemListItem } from './ItemList'

export type ConfirmItemStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export type ConfirmListItem = {
  id: string
  status: ConfirmItemStatus
  record: Record<string, unknown>
  confirmedLabel: string
  canceledLabel: string
}

export type ConfirmItemListProps = {
  items: ConfirmListItem[]
  pendingHint?: string
  confirmLabel: string
  skipLabel: string
  disabled?: boolean
  onConfirm: (id: string) => void
  onSkip: (id: string) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function formatDisplayValue(value: unknown): string {
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

function formatRecordLines(record: Record<string, unknown>): string {
  return Object.entries(record)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${formatDisplayValue(value)}`)
    .join('\n')
}

function RecordLines({ record }: { record: Record<string, unknown> }) {
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

function ConfirmItemList({
  items,
  pendingHint,
  confirmLabel,
  skipLabel,
  disabled,
  onConfirm,
  onSkip,
}: ConfirmItemListProps) {
  const hasPending = items.some((item) => item.status === 'pending_confirmation')
  if (items.length === 0) {
    return null
  }
  return (
    <div className="mt-2 flex flex-col gap-2">
      {hasPending && pendingHint ? (
        <p className="text-xs text-muted-foreground">{pendingHint}</p>
      ) : null}
      <ItemList>
        {items.map((item) => (
          <ItemListItem key={item.id}>
            <ItemListContent>
              {item.status === 'confirmed' ? (
                <p className="truncate text-xs">{item.confirmedLabel}</p>
              ) : item.status === 'rejected' ? (
                <p className="truncate text-xs">{item.canceledLabel}</p>
              ) : (
                <>
                  <RecordLines record={item.record} />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      className="h-auto px-0"
                      disabled={disabled}
                      onClick={() => onConfirm(item.id)}
                    >
                      {confirmLabel}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="link"
                      className="h-auto px-0"
                      disabled={disabled}
                      onClick={() => onSkip(item.id)}
                    >
                      {skipLabel}
                    </Button>
                  </div>
                </>
              )}
            </ItemListContent>
          </ItemListItem>
        ))}
      </ItemList>
    </div>
  )
}

export { ConfirmItemList }
