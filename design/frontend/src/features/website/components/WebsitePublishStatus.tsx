import { useTranslation } from 'react-i18next'
import { FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusTag } from '@webonone/ui-kit'
import type { WebsitePublishStatus } from '../types'

export function WebsitePublishStatusTag({ status }: { status?: WebsitePublishStatus | null }) {
  const { t } = useTranslation('website')
  if (!status) return null
  return (
    <StatusTag variant={status === 'published' ? 'approved' : 'pending'}>
      {status === 'published' ? t('published') : t('draft')}
    </StatusTag>
  )
}

export function WebsitePublishStatusField({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string
  value: WebsitePublishStatus
  disabled?: boolean
  onChange: (status: WebsitePublishStatus) => void
}) {
  const { t } = useTranslation('website')
  return (
    <FormField label={t('publishStatus')} htmlFor={id}>
      <Select value={value} onValueChange={(next) => onChange(next as WebsitePublishStatus)} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">{t('draft')}</SelectItem>
          <SelectItem value="published">{t('published')}</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

export function usableLibraryItems<T extends { id: string; publishStatus?: WebsitePublishStatus | null }>(
  items: T[],
  selected: Array<string | null | undefined> = [],
): T[] {
  const keep = new Set(selected.filter((id): id is string => Boolean(id)))
  return items.filter((item) => item.publishStatus !== 'draft' || keep.has(item.id))
}
