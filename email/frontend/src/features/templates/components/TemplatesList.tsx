import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CollectionListView,
  DropdownMenuItem,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  dateSortColumn,
} from '@webonone/ui-kit'
import { useNavigateEmail } from '@/features/shell/utils/navigateEmail'
import type { EmailTemplate } from '@/shared/types/email.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

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

export function TemplatesList({ templates, onEdit, onToggleActive, busyId }: TemplatesListProps) {
  const { t, i18n } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const { goToDetail, goToPreview, goToVersions } = useNavigateEmail()
  const items = Array.isArray(templates) ? templates : []

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: EmailTemplate, b: EmailTemplate) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (template: EmailTemplate) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => goToDetail(template.id)}
          >
            {template.name}
          </button>
        ),
      },
      dateSortColumn<EmailTemplate>(
        'updated',
        'Updated',
        (item) => item.updatedAt,
        (iso) => formatDisplayDateTime(iso, i18n.language),
      ),
    ],
    [goToDetail, i18n.language, t, tc],
  )

  function renderRowMenu(template: EmailTemplate) {
    const isBusy = busyId === template.id
    const isDefault = Boolean(template.isDefault)
    return (
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
        <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
          {template.isActive ? t('deactivate') : t('activate')}
        </DropdownMenuItem>
        {!isDefault ? (
          <DropdownMenuItem onClick={() => goToVersions(template.id)} disabled={isBusy}>
            {t('versionHistory')}
          </DropdownMenuItem>
        ) : null}
      </ItemListMenu>
    )
  }

  function rowBody(template: EmailTemplate) {
    return (
      <>
        <p className="font-medium">{template.name}</p>
        <p className="text-xs text-muted-foreground">
          {t('metaLine', {
            slug: template.slug,
            scope: formatScope(template, t),
            active: template.isActive ? t('active') : t('inactive'),
            date: formatDisplayDateTime(template.updatedAt, i18n.language),
          })}
        </p>
      </>
    )
  }

  return (
    <CollectionListView
      items={items}
      getRowKey={(template) => template.id}
      columns={columns}
      empty={<ItemListEmpty>{t('emptyScope')}</ItemListEmpty>}
      renderGridActions={renderRowMenu}
      renderListItem={(template) => (
        <ItemListItem>
          <ItemListContent>
            <button
              type="button"
              className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => goToDetail(template.id)}
            >
              {rowBody(template)}
            </button>
          </ItemListContent>
          {renderRowMenu(template)}
        </ItemListItem>
      )}
      renderCard={(template) => (
        <ItemListCollectionCard
          image={<ItemListCardPlaceholderImage alt={template.name} />}
          menu={renderRowMenu(template)}
          onBodyClick={() => goToDetail(template.id)}
        >
          {rowBody(template)}
        </ItemListCollectionCard>
      )}
    />
  )
}
