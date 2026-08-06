import { useTranslation } from 'react-i18next'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { useNavigateEmail } from '@/features/shell/utils/navigateEmail'
import type { EmailTemplate } from '@/shared/types/email.types'

interface TemplatesListProps {
  templates: EmailTemplate[]
  onEdit: (template: EmailTemplate) => void
  onToggleActive: (template: EmailTemplate) => void
  busyId: string | null
}

function formatScope(template: EmailTemplate, t: (k: string) => string): string {
  if (template.isDefault) return t('scopeDefault')
  return template.scope === 'platform' ? t('scopePlatform') : t('scopeCompany')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function TemplatesList({ templates, onEdit, onToggleActive, busyId }: TemplatesListProps) {
  const { t } = useTranslation('templates')
  const { goToDetail, goToPreview, goToVersions } = useNavigateEmail()
  const items = Array.isArray(templates) ? templates : []

  if (items.length === 0) {
    return <ItemListEmpty>{t('emptyScope')}</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((template) => {
        const isBusy = busyId === template.id
        const isDefault = Boolean(template.isDefault)

        return (
          <ItemListItem key={template.id}>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => goToDetail(template.id)}
              >
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t('metaLine', {
                    slug: template.slug,
                    scope: formatScope(template, t),
                    active: template.isActive ? t('active') : t('inactive'),
                    date: formatDate(template.updatedAt),
                  })}
                </p>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={t('actionsFor', { name: template.name })}>
              <DropdownMenuItem onClick={() => goToDetail(template.id)} disabled={isBusy}>
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)} disabled={isBusy}>
                {isDefault ? t('customize') : t('common:edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goToPreview(template.id)} disabled={isBusy}>
                {t('preview')}
              </DropdownMenuItem>
              {!isDefault ? (
                <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
                  {template.isActive ? t('deactivate') : t('activate')}
                </DropdownMenuItem>
              ) : null}
              {!isDefault ? (
                <DropdownMenuItem onClick={() => goToVersions(template.id)} disabled={isBusy}>
                  {t('versionHistory')}
                </DropdownMenuItem>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
