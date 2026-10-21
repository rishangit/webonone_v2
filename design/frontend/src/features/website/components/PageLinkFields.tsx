import { useTranslation } from 'react-i18next'
import { Checkbox, FormField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@webonone/ui-kit'

type PageOption = { id: string; name: string }

interface PageLinkFieldsProps {
  idPrefix: string
  linkPageId?: string | null
  pages: PageOption[]
  onChange: (linkPageId: string | null) => void
}

/** Checkbox turns the page list on. An empty id means the box is checked and no page is chosen yet. */
export function PageLinkFields({ idPrefix, linkPageId, pages, onChange }: PageLinkFieldsProps) {
  const { t } = useTranslation('website')
  const linked = linkPageId != null

  return (
    <>
      <label className="flex items-center gap-2 text-sm" htmlFor={`${idPrefix}-link`}>
        <Checkbox
          id={`${idPrefix}-link`}
          checked={linked}
          onCheckedChange={(value) => onChange(value === true ? (linkPageId ?? '') : null)}
        />
        {t('linkToPage')}
      </label>
      {linked ? (
        <FormField label={t('linkPage')} htmlFor={`${idPrefix}-page`}>
          <Select
            value={linkPageId || '__none'}
            onValueChange={(value) => onChange(value === '__none' ? '' : value)}
          >
            <SelectTrigger id={`${idPrefix}-page`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{t('selectPage')}</SelectItem>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : null}
    </>
  )
}
