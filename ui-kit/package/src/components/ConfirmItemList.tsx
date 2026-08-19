import { useMemo, useState } from 'react'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { ItemList, ItemListContent, ItemListItem } from './ItemList'

export type ConfirmItemStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export type ConfirmRelatedNode = {
  path: string
  displayKey: string
  exists: boolean
  selected: boolean
  record: Record<string, unknown>
  children?: ConfirmRelatedNode[]
}

export type ConfirmListItem = {
  id: string
  status: ConfirmItemStatus
  record: Record<string, unknown>
  relatedTree?: ConfirmRelatedNode[]
  confirmedLabel: string
  canceledLabel: string
}

export type ConfirmItemListProps = {
  items: ConfirmListItem[]
  pendingHint?: string
  confirmLabel: string
  skipLabel: string
  disabled?: boolean
  onConfirm: (id: string, selections: Record<string, boolean>) => void
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
  onToggle,
}: {
  nodes: ConfirmRelatedNode[]
  selections: Record<string, boolean>
  ancestorSelected: boolean
  disabled?: boolean
  onToggle: (path: string, checked: boolean) => void
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
              return (
                <div key={node.path} className="space-y-1">
                  <label className="flex items-start gap-2 text-xs">
                    <Checkbox
                      checked={checked}
                      disabled={!enabled}
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
                    <RecordLines record={node.record} hideKeys={new Set(['name'])} />
                    {node.children && node.children.length > 0 ? (
                      <div className="mt-1">
                        <RelatedTree
                          nodes={node.children}
                          selections={selections}
                          ancestorSelected={ancestorSelected && checked}
                          disabled={disabled}
                          onToggle={onToggle}
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
  onConfirm: (id: string, selections: Record<string, boolean>) => void
  onSkip: (id: string) => void
}) {
  const tree = item.relatedTree ?? []
  const defaults = useMemo(() => defaultSelections(item.relatedTree ?? []), [item.relatedTree])
  const [selections, setSelections] = useState<Record<string, boolean>>(defaults)

  if (item.status === 'confirmed') {
    return <p className="truncate text-xs">{item.confirmedLabel}</p>
  }
  if (item.status === 'rejected') {
    return <p className="truncate text-xs">{item.canceledLabel}</p>
  }

  return (
    <>
      <RecordLines record={item.record} />
      {tree.length > 0 ? (
        <div className="mt-2">
          <RelatedTree
            nodes={tree}
            selections={selections}
            ancestorSelected
            disabled={disabled}
            onToggle={(path, checked) => setSelections((current) => ({ ...current, [path]: checked }))}
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
            onConfirm(item.id, { ...defaults, ...selections })
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
          <ItemListItem key={item.id}>
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
