import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@webonone/ui-kit'
import {
  flattenPropertyPaths,
  nodeCheckState,
  togglePropertySelection,
  type DatasetPropertyNode,
} from '../schemas/websiteDatasetSchemas'
import { BindingValueTypeBadge } from './BindingValueTypeBadge'

interface DatasetPropertyTreeSelectProps {
  nodes: DatasetPropertyNode[]
  value: string[]
  onChange: (next: string[]) => void
  error?: string
}

function PropertyNodeRow({
  node,
  depth,
  selected,
  expanded,
  onToggleExpand,
  onToggleCheck,
}: {
  node: DatasetPropertyNode
  depth: number
  selected: Set<string>
  expanded: Set<string>
  onToggleExpand: (path: string) => void
  onToggleCheck: (node: DatasetPropertyNode, checked: boolean) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isExpanded = expanded.has(node.path)
  const state = nodeCheckState(selected, node)

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40"
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground"
            aria-expanded={isExpanded}
            onClick={() => onToggleExpand(node.path)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-6 shrink-0" aria-hidden />
        )}
        <Checkbox
          checked={state}
          onCheckedChange={(next) => onToggleCheck(node, next === true)}
          aria-label={node.label}
        />
        <BindingValueTypeBadge valueType={node.valueType} />
        <span className="min-w-0 flex-1 truncate text-sm">{node.label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{node.path}</span>
      </div>
      {hasChildren && isExpanded
        ? node.children!.map((child) => (
            <PropertyNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onToggleCheck={onToggleCheck}
            />
          ))
        : null}
    </div>
  )
}

export function DatasetPropertyTreeSelect({
  nodes,
  value,
  onChange,
  error,
}: DatasetPropertyTreeSelectProps) {
  const { t } = useTranslation('website')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const selected = useMemo(() => new Set(value), [value])
  const allPaths = useMemo(() => flattenPropertyPaths(nodes), [nodes])

  const summary =
    value.length === 0
      ? t('datasetPropertiesNone')
      : value.length === 1
        ? value[0]
        : t('datasetPropertiesCount', { count: value.length })

  function toggleExpand(path: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function onToggleCheck(node: DatasetPropertyNode, checked: boolean) {
    onChange(togglePropertySelection(value, node, checked))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-10 w-full justify-between border-[hsl(var(--glass-border))] px-3 font-normal',
              error && 'border-destructive',
            )}
          >
            <span className="truncate">{summary}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,28rem)] p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[hsl(var(--glass-border))] px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onChange([...allPaths])}
            >
              {t('datasetPropertiesSelectAll')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => onChange([])}
            >
              {t('datasetPropertiesClear')}
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto scrollbar-themed py-1">
            {nodes.map((node) => (
              <PropertyNodeRow
                key={node.path}
                node={node}
                depth={0}
                selected={selected}
                expanded={expanded}
                onToggleExpand={toggleExpand}
                onToggleCheck={onToggleCheck}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
