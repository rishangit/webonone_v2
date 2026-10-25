import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button, cn } from '@webonone/ui-kit'
import { ManualTemplateField } from '../../components/ManualTemplateField'
import {
  createEmptyNestedRow,
  readNestedRows,
  readRecordValue,
  writeRecordValue,
  type ListDataNode,
} from '../../document/list'
import { TREE_NEST, TreeExpandToggle } from '../../components/contentTree/treeUi'
import type { MediaRef } from '../../types'

export type ListImagePickRequest = {
  multi: boolean
  applyPick: (picked: MediaRef) => void
}

export function ListManualDataTree({
  nodes,
  data,
  onChange,
  onRequestImagePick,
  depth = 0,
}: {
  nodes: ListDataNode[]
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  onRequestImagePick: (request: ListImagePickRequest) => void
  depth?: number
}) {
  const { t } = useTranslation('website')

  return (
    <div className={cn(depth > 0 && TREE_NEST, 'space-y-2')}>
      {nodes.map((node) =>
        node.kind === 'field' ? (
          <ManualTemplateField
            key={node.path}
            id={`field-${node.path}`}
            label={node.label}
            fieldKind={node.fieldKind}
            value={readRecordValue(data, node.path)}
            onChange={(value) => onChange(writeRecordValue(data, node.path, value))}
            pickImageLabel={t('pickImage')}
            onPickImage={(multi) => {
              onRequestImagePick({
                multi,
                applyPick: (picked) => {
                  const current = readRecordValue(data, node.path)
                  onChange(
                    writeRecordValue(data, node.path, appendMediaPick(current, picked, multi)),
                  )
                },
              })
            }}
          />
        ) : (
          <ListManualDataSet
            key={node.id}
            node={node}
            data={data}
            onChange={onChange}
            onRequestImagePick={onRequestImagePick}
            depth={depth}
          />
        ),
      )}
    </div>
  )
}

function ListManualDataSet({
  node,
  data,
  onChange,
  onRequestImagePick,
  depth,
}: {
  node: Extract<ListDataNode, { kind: 'set' }>
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  onRequestImagePick: (request: ListImagePickRequest) => void
  depth: number
}) {
  const { t } = useTranslation('website')
  const [open, setOpen] = useState(true)
  const rows = readNestedRows(data, node.path)

  function updateRows(nextRows: Record<string, unknown>[]) {
    onChange(writeRecordValue(data, node.path, nextRows))
  }

  function updateRow(index: number, rowData: Record<string, unknown>) {
    const next = [...rows]
    next[index] = rowData
    updateRows(next)
  }

  return (
    <div className="space-y-2 rounded-md border border-[hsl(var(--glass-border))] p-2">
      <div className="flex items-center gap-1">
        <TreeExpandToggle
          open={open}
          expandLabel={t('expand')}
          collapseLabel={t('collapse')}
          onToggle={() => setOpen((value) => !value)}
        />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{node.label}</p>
        <Button
          type="button"
          variant="outline"
          className="h-8 shrink-0 px-2"
          onClick={() => updateRows([...rows, createEmptyNestedRow()])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
          {t('addNestedRow')}
        </Button>
      </div>
      {open ? (
        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('listNestedRowsEmpty')}</p>
          ) : null}
          {rows.map((row, index) => (
            <div
              key={String(row._id ?? index)}
              className="space-y-2 rounded-md border border-dashed border-[hsl(var(--glass-border))] p-2"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('listNestedRowN', { index: index + 1 })}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="ml-auto size-7"
                  aria-label={t('removeNestedRow')}
                  onClick={() => updateRows(rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
              <ListManualDataTree
                nodes={node.nodes}
                data={row}
                onChange={(nextRow) => updateRow(index, nextRow)}
                onRequestImagePick={onRequestImagePick}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function appendMediaPick(current: unknown, picked: MediaRef, multi: boolean): unknown {
  if (!multi) return picked
  const list = Array.isArray(current) ? (current as MediaRef[]) : []
  return [...list, picked]
}
