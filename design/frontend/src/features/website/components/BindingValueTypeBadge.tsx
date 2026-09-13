import { cn } from '@webonone/ui-kit'
import type { DatasetPropertyValueType } from '../schemas/websiteDatasetSchemas'

const TYPE_LABEL: Record<DatasetPropertyValueType, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  media: 'media',
}

/** Compact type chip shown in front of Data Binding dropdown options. */
export function BindingValueTypeBadge({
  valueType,
  className,
}: {
  valueType: DatasetPropertyValueType | undefined
  className?: string
}) {
  if (!valueType) return null
  return (
    <span
      className={cn(
        'shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none text-muted-foreground',
        className,
      )}
    >
      {TYPE_LABEL[valueType]}
    </span>
  )
}
