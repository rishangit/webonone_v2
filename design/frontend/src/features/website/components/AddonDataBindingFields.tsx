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
import { ADDON_BINDABLE_PROP_KEYS } from '../document/dataBinding'
import {
  flattenPropertyPaths,
  propertyTreeForSource,
  relativeFieldsUnderPath,
  valueTypeForPropertyPath,
  type AnalyticsDimension,
  type DatasetSourceType,
} from '../schemas/websiteDatasetSchemas'
import type { WebsiteAddon, WebsiteDataset } from '../types'
import { BindingValueTypeBadge } from './BindingValueTypeBadge'

interface AddonDataBindingFieldsProps {
  addon: WebsiteAddon
  dataset: WebsiteDataset | null
  /** When true, dataset comes from a parent owner (slider/block), not this addon. */
  inheritedFromParent?: boolean
  /**
   * When set (e.g. nested parent-path slider `itemsPath`), field options are relative
   * to that array/object item instead of the outer dataset row.
   */
  fieldPathPrefix?: string | null
  onChange: (addon: WebsiteAddon) => void
}

export function AddonDataBindingFields({
  addon,
  dataset,
  inheritedFromParent = false,
  fieldPathPrefix = null,
  onChange,
}: AddonDataBindingFieldsProps) {
  const { t } = useTranslation('website')
  const bindableKeys = ADDON_BINDABLE_PROP_KEYS[addon.type]

  const fields = useMemo(() => {
    if (!dataset) return []
    const sourceType = dataset.sourceType as DatasetSourceType
    const tree = propertyTreeForSource(sourceType, {
      dimension: dataset.config.dimension as AnalyticsDimension | undefined,
    })
    const prefix = fieldPathPrefix?.trim()
    if (prefix) {
      const relative = relativeFieldsUnderPath(tree, prefix)
      if (relative.length > 0) return relative
    }
    const allowed = new Set(
      dataset.selectedFields?.length
        ? dataset.selectedFields
        : flattenPropertyPaths(tree),
    )
    const labelByPath = new Map<string, string>()
    function walk(nodes: typeof tree) {
      for (const node of nodes) {
        labelByPath.set(node.path, node.label)
        if (node.children) walk(node.children)
      }
    }
    walk(tree)
    return [...allowed].map((path) => ({
      field: path,
      label: labelByPath.get(path) ?? path,
      valueType: valueTypeForPropertyPath(tree, path),
    }))
  }, [dataset, fieldPathPrefix])

  if (!dataset) {
    return <p className="text-sm text-muted-foreground">{t('addonDataBindingNeedsParent')}</p>
  }

  if (bindableKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('addonDataBindingUnsupported')}</p>
  }

  function setFieldBinding(propKey: string, fieldPath: string) {
    const nextFields = { ...(addon.dataBinding?.fields ?? {}) }
    if (!fieldPath) delete nextFields[propKey]
    else nextFields[propKey] = fieldPath
    onChange({
      ...addon,
      dataBinding: { fields: nextFields },
    })
  }

  return (
    <div className="space-y-4">
      {inheritedFromParent ? (
        <div className="space-y-2 rounded-md border border-[hsl(var(--glass-border))] bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">
            {fieldPathPrefix?.trim()
              ? t('addonDataBindingNestedRowHelp', {
                  dataset: dataset.name,
                  path: fieldPathPrefix.trim(),
                })
              : t('addonDataBindingInheritedHelp', { dataset: dataset.name })}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <BindingValueTypeBadge valueType={fieldPathPrefix?.trim() ? 'object' : 'array'} />
            <span className="font-medium">{dataset.name}</span>
            <span className="text-muted-foreground">
              ({fieldPathPrefix?.trim() ? fieldPathPrefix.trim() : t('inheritedFromSlider')})
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t('addonDataBindingHelp', { dataset: dataset.name })}
        </p>
      )}
      {bindableKeys.map((propKey) => (
        <FormField key={propKey} label={t(`bindingProp.${propKey}`)} htmlFor={`addon-bind-${propKey}`}>
          <Select
            value={addon.dataBinding?.fields?.[propKey] || '__none__'}
            onValueChange={(value) => setFieldBinding(propKey, value === '__none__' ? '' : value)}
          >
            <SelectTrigger id={`addon-bind-${propKey}`}>
              <SelectValue placeholder={t('bindingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
              {fields.map((field) => (
                <SelectItem key={field.field} value={field.field}>
                  <span className="flex items-center gap-2">
                    <BindingValueTypeBadge valueType={field.valueType} />
                    <span className="truncate">{field.label || field.field}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ))}
    </div>
  )
}
