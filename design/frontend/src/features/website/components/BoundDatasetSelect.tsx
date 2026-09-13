import { useTranslation } from 'react-i18next'
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import type { WebsiteDataset } from '../types'
import { BindingValueTypeBadge } from './BindingValueTypeBadge'

interface BoundDatasetSelectProps {
  id: string
  value: string | null
  datasets: WebsiteDataset[]
  onChange: (datasetId: string | null) => void
  hint?: string
}

/** Shared dataset picker for content-block and slider Data Binding tabs. */
export function BoundDatasetSelect({
  id,
  value,
  datasets,
  onChange,
  hint,
}: BoundDatasetSelectProps) {
  const { t } = useTranslation('website')

  return (
    <FormField label={t('boundDataset')} htmlFor={id}>
      <Select
        value={value || '__none__'}
        onValueChange={(next) => onChange(next === '__none__' ? null : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={t('boundDatasetPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{t('bindingNone')}</SelectItem>
          {datasets.map((dataset) => (
            <SelectItem key={dataset.id} value={dataset.id}>
              <span className="flex items-center gap-2">
                {/* Datasets are always a list of row objects. */}
                <BindingValueTypeBadge valueType="array" />
                <span className="truncate">{dataset.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </FormField>
  )
}
