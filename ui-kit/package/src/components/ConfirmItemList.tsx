import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { Input } from './Input'
import { ItemList, ItemListContent, ItemListItem } from './ItemList'

export type ConfirmItemStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export const CONFIRM_MISSING_VALUE = '—'

export type ConfirmDisplayField = {
  key: string
  label: string
  value: string
  missing: boolean
  editable: boolean
  inputType: 'text' | 'number'
}

export type ConfirmRelatedNode = {
  path: string
  displayKey: string
  exists: boolean
  selected: boolean
  record: Record<string, unknown>
  displayFields?: ConfirmDisplayField[]
  children?: ConfirmRelatedNode[]
}

export type ConfirmListItem = {
  id: string
  status: ConfirmItemStatus
  record: Record<string, unknown>
  displayFields?: ConfirmDisplayField[]
  relatedTree?: ConfirmRelatedNode[]
  confirmedLabel: string
  canceledLabel: string
}

export type ConfirmItemDecision = {
  relatedSelections: Record<string, boolean>
  argumentOverrides?: Record<string, unknown>
  relatedArgumentOverrides?: Record<string, Record<string, unknown>>
}

export type ConfirmItemListProps = {
  items: ConfirmListItem[]
  pendingHint?: string
  confirmLabel: string
  skipLabel: string
  disabled?: boolean
  onConfirm: (id: string, decision: ConfirmItemDecision) => void
  onSkip: (id: string) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isHiddenConfirmKey(key: string): boolean {
  return key === 'id' || key.startsWith('__') || /_ids?$/i.test(key)
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
    .filter(([key, value]) => !isHiddenConfirmKey(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${formatDisplayValue(value)}`)
    .join('\n')
}

function parseFieldOverride(field: ConfirmDisplayField, raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) {
    return undefined
  }
  if (field.inputType === 'number') {
    const num = Number(trimmed)
    return Number.isFinite(num) ? Math.trunc(num) : trimmed
  }
  return trimmed
}

function displayValueForField(field: ConfirmDisplayField, overrides: Record<string, unknown>): string {
  if (field.key in overrides) {
    const value = overrides[field.key]
    if (value === undefined || value === null || value === '') {
      return CONFIRM_MISSING_VALUE
    }
    return String(value)
  }
  return field.value
}

function isMissingDisplayValue(value: string): boolean {
  return value === CONFIRM_MISSING_VALUE || value === '-'
}

function DisplayFieldsLines({
  fields,
  overrides,
  onOverride,
  disabled,
}: {
  fields: ConfirmDisplayField[]
  overrides: Record<string, unknown>
  onOverride: (key: string, value: unknown) => void
  disabled?: boolean
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(field: ConfirmDisplayField) {
    setEditingKey(field.key)
    const current = displayValueForField(field, overrides)
    setDraft(isMissingDisplayValue(current) ? '' : current)
  }

  function saveEdit(field: ConfirmDisplayField) {
    const parsed = parseFieldOverride(field, draft)
    if (parsed !== undefined) {
      onOverride(field.key, parsed)
    }
    setEditingKey(null)
    setDraft('')
  }

  return (
    <div className="space-y-0.5 text-xs">
      {fields.map((field) => {
        const value = displayValueForField(field, overrides)
        const missing = isMissingDisplayValue(value)
        const isEditing = editingKey === field.key
        return (
          <div key={field.key} className="flex items-start gap-1">
            {isEditing ? (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-muted-foreground">{field.label}:</span>
                <Input
                  type={field.inputType === 'number' ? 'number' : 'text'}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="h-8 text-xs"
                  disabled={disabled}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="link"
                    className="h-auto px-0 text-xs"
                    disabled={disabled}
                    onClick={() => saveEdit(field)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="link"
                    className="h-auto px-0 text-xs"
                    disabled={disabled}
                    onClick={() => {
                      setEditingKey(null)
                      setDraft('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${missing ? 'italic text-muted-foreground' : ''}`}>
                  <span className={missing ? 'text-muted-foreground' : 'text-muted-foreground'}>{field.label}:</span>
                  {value}
                </p>
                {field.editable && missing && !disabled ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 p-0"
                    aria-label={`Edit ${field.label}`}
                    onClick={() => startEdit(field)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                ) : null}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RecordLines({ record, hideKeys }: { record: Record<string, unknown>; hideKeys?: Set<string> }) {
  const entries = Object.entries(record).filter(
    ([key, value]) =>
      !isHiddenConfirmKey(key) &&
      !hideKeys?.has(key) &&
      value !== undefined &&
      value !== null &&
      value !== '',
  )
  return (
    <div className="space-y-0.5 text-xs">
      {entries.map(([key, value]) =>
        isRecord(value) ? (
          <div key={key} className="space-y-0.5">
            <p className="text-muted-foreground">{key}:</p>
            <div className="ml-3 border-l border-border pl-2">
              <RecordLines record={value} />
            </div>
          </div>
        ) : (
          <p key={key} className="whitespace-pre-wrap break-words">
            <span className="text-muted-foreground">{key}:</span>
            {formatDisplayValue(value)}
          </p>
        ),
      )}
    </div>
  )
}

function defaultSelections(nodes: ConfirmRelatedNode[]): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const node of nodes) {
    next[node.path] = node.exists || node.selected
    if (node.children) {
      Object.assign(next, defaultSelections(node.children))
    }
  }
  return next
}

function nodeLabel(node: ConfirmRelatedNode): string {
  const fromFields = node.displayFields?.find((field) => field.key === 'name')?.value
  if (typeof fromFields === 'string' && fromFields.trim() && fromFields !== CONFIRM_MISSING_VALUE) {
    return fromFields.trim()
  }
  const name = node.record.name
  return typeof name === 'string' && name.trim() ? name : node.path
}

function groupNodes(nodes: ConfirmRelatedNode[]): Array<{ key: string; nodes: ConfirmRelatedNode[] }> {
  const order: string[] = []
  const grouped = new Map<string, ConfirmRelatedNode[]>()
  for (const node of nodes) {
    const list = grouped.get(node.displayKey) ?? []
    if (list.length === 0) {
      order.push(node.displayKey)
    }
    list.push(node)
    grouped.set(node.displayKey, list)
  }
  return order.map((key) => ({ key, nodes: grouped.get(key) ?? [] }))
}

function RelatedTree({
  nodes,
  selections,
  ancestorSelected,
  disabled,
  relatedOverrides,
  onToggle,
  onRelatedOverride,
}: {
  nodes: ConfirmRelatedNode[]
  selections: Record<string, boolean>
  ancestorSelected: boolean
  disabled?: boolean
  relatedOverrides: Record<string, Record<string, unknown>>
  onToggle: (path: string, checked: boolean) => void
  onRelatedOverride: (path: string, key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-2">
      {groupNodes(nodes).map((group) => (
        <div key={group.key} className="space-y-1">
          <p className="text-xs text-muted-foreground">{group.key}:</p>
          <div className="ml-3 space-y-2 border-l border-border pl-2">
            {group.nodes.map((node) => {
              const checked = node.exists || (selections[node.path] ?? node.selected)
              const enabled = ancestorSelected && !node.exists && !disabled
              const nodeOverrides = relatedOverrides[node.path] ?? {}
              return (
                <div key={node.path} className="space-y-1">
                  <label className="flex items-start gap-2 text-xs">
                    <Checkbox
                      checked={checked}
                      disabled={!enabled && !node.exists}
                      onCheckedChange={(value) => {
                        if (!enabled) {
                          return
                        }
                        onToggle(node.path, value === true)
                      }}
                      className="mt-0.5"
                    />
                    <span className={node.exists ? 'text-muted-foreground' : undefined}>{nodeLabel(node)}</span>
                  </label>
                  <div className="ml-7">
                    {node.displayFields && node.displayFields.length > 0 ? (
                      <DisplayFieldsLines
                        fields={node.displayFields.filter((field) => field.key !== 'name')}
                        overrides={nodeOverrides}
                        onOverride={(key, value) => onRelatedOverride(node.path, key, value)}
                        disabled={disabled || node.exists}
                      />
                    ) : (
                      <RecordLines record={node.record} hideKeys={new Set(['name'])} />
                    )}
                    {node.children && node.children.length > 0 ? (
                      <div className="mt-1">
                        <RelatedTree
                          nodes={node.children}
                          selections={selections}
                          ancestorSelected={ancestorSelected && checked}
                          disabled={disabled}
                          relatedOverrides={relatedOverrides}
                          onToggle={onToggle}
                          onRelatedOverride={onRelatedOverride}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConfirmItem({
  item,
  confirmLabel,
  skipLabel,
  disabled,
  onConfirm,
  onSkip,
}: {
  item: ConfirmListItem
  confirmLabel: string
  skipLabel: string
  disabled?: boolean
  onConfirm: (id: string, decision: ConfirmItemDecision) => void
  onSkip: (id: string) => void
}) {
  const tree = item.relatedTree ?? []
  const defaults = useMemo(() => defaultSelections(item.relatedTree ?? []), [item.relatedTree])
  const [selections, setSelections] = useState<Record<string, boolean>>(defaults)
  const [argumentOverrides, setArgumentOverrides] = useState<Record<string, unknown>>({})
  const [relatedArgumentOverrides, setRelatedArgumentOverrides] = useState<
    Record<string, Record<string, unknown>>
  >({})

  if (item.status === 'confirmed') {
    return <p className="truncate text-xs">{item.confirmedLabel}</p>
  }
  if (item.status === 'rejected') {
    return <p className="truncate text-xs">{item.canceledLabel}</p>
  }

  return (
    <>
      {item.displayFields && item.displayFields.length > 0 ? (
        <DisplayFieldsLines
          fields={item.displayFields}
          overrides={argumentOverrides}
          onOverride={(key, value) => setArgumentOverrides((current) => ({ ...current, [key]: value }))}
          disabled={disabled}
        />
      ) : (
        <RecordLines record={item.record} />
      )}
      {tree.length > 0 ? (
        <div className="mt-2">
          <RelatedTree
            nodes={tree}
            selections={selections}
            ancestorSelected
            disabled={disabled}
            relatedOverrides={relatedArgumentOverrides}
            onToggle={(path, checked) => setSelections((current) => ({ ...current, [path]: checked }))}
            onRelatedOverride={(path, key, value) =>
              setRelatedArgumentOverrides((current) => ({
                ...current,
                [path]: { ...(current[path] ?? {}), [key]: value },
              }))
            }
          />
        </div>
      ) : null}
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="link"
          className="h-auto px-0"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            event.currentTarget.blur()
            onConfirm(item.id, {
              relatedSelections: { ...defaults, ...selections },
              argumentOverrides:
                Object.keys(argumentOverrides).length > 0 ? argumentOverrides : undefined,
              relatedArgumentOverrides:
                Object.keys(relatedArgumentOverrides).length > 0 ? relatedArgumentOverrides : undefined,
            })
          }}
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="link"
          className="h-auto px-0"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            event.currentTarget.blur()
            onSkip(item.id)
          }}
        >
          {skipLabel}
        </Button>
      </div>
    </>
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
          <ItemListItem key={item.id} data-confirm-item={item.id}>
            <ItemListContent>
              <ConfirmItem
                item={item}
                confirmLabel={confirmLabel}
                skipLabel={skipLabel}
                disabled={disabled}
                onConfirm={onConfirm}
                onSkip={onSkip}
              />
            </ItemListContent>
          </ItemListItem>
        ))}
      </ItemList>
    </div>
  )
}

export { ConfirmItemList }
