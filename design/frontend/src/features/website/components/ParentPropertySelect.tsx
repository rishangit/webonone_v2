import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import {
  flattenPropertyPaths,
  propertyTreeForSource,
  valueTypeForPropertyPath,
  type AnalyticsDimension,
  type DatasetSourceType,
} from '../schemas/websiteDatasetSchemas'
import type { WebsiteDataset } from '../types'
import { BindingValueTypeBadge } from './BindingValueTypeBadge'

type ParentPropertySelectProps = {
  id: string
  dataset: WebsiteDataset | null
  value: string
  onChange: (path: string) => void
  /** When true, only array/object paths (typical for nested list/scope). */
  complexOnly?: boolean
  hint?: string
}

/** Pick a dotted property path on the parent dataset row. */
export function ParentPropertySelect({
  id,
  dataset,
  value,
  onChange,
  complexOnly = false,
  hint,
}: ParentPropertySelectProps) {
  const { t } = useTranslation('website')

  const options = useMemo(() => {
    if (!dataset) return []
    const sourceType = dataset.sourceType as DatasetSourceType
    const tree = propertyTreeForSource(sourceType, {
      dimension: dataset.config.dimension as AnalyticsDimension | undefined,
    })
    const allowed = new Set(
      dataset.selectedFields?.length ? dataset.selectedFields : flattenPropertyPaths(tree),
    )
    const labelByPath = new Map<string, string>()
    function walk(nodes: typeof tree) {
      for (const node of nodes) {
        labelByPath.set(node.path, node.label)
        if (node.children) walk(node.children)
      }
    }
    walk(tree)

    const paths = [...allowed].filter((path) => {
      if (!complexOnly) return true
      const valueType = valueTypeForPropertyPath(tree, path)
      return valueType === 'array' || valueType === 'object'
    })

    // Always include complex roots even when selectedFields lists only leaves.
    if (complexOnly) {
      function collectComplex(nodes: typeof tree) {
        for (const node of nodes) {
          if (
            (node.valueType === 'array' || node.valueType === 'object') &&
            !paths.includes(node.path)
          ) {
            paths.push(node.path)
            labelByPath.set(node.path, node.label)
          }
          if (node.children) collectComplex(node.children)
        }
      }
      collectComplex(tree)
    }

    return paths
      .map((path) => ({
        path,
        label: labelByPath.get(path) ?? path,
        valueType: valueTypeForPropertyPath(tree, path),
      }))
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [complexOnly, dataset])

  return (
    <div className="space-y-1.5">
      <FormField label={t('parentProperty')} htmlFor={id}>
        <Select
          value={value || '__none__'}
          onValueChange={(next) => onChange(next === '__none__' ? '' : next)}
          disabled={!dataset}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={t('parentPropertyPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.path} value={option.path}>
                <span className="flex items-center gap-2">
                  <BindingValueTypeBadge valueType={option.valueType} />
                  <span className="truncate">{option.label || option.path}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
