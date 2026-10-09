import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  CollectionListView,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemListCardPlaceholderImage,
  ItemListCollectionCard,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  dateSortColumn,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateSms } from '@/features/shell/utils/navigateSms'
import type { SmsTemplate } from '@/shared/types/sms.types'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

interface TemplatesListProps {
  templates: SmsTemplate[]
  onEdit: (template: SmsTemplate) => void
  onToggleActive: (template: SmsTemplate) => void
  onDelete: (template: SmsTemplate) => void
  busyId: string | null
  canDelete: boolean
}

function formatScope(template: SmsTemplate, t: (k: string) => string): string {
  if (template.isDefault) return t('scopeDefault')
  return template.scope === 'platform' ? t('scopePlatform') : t('scopeCompany')
}

export function TemplatesList({
  templates,
  onEdit,
  onToggleActive,
  onDelete,
  busyId,
  canDelete,
}: TemplatesListProps) {
  const { t, i18n } = useTranslation('templates')
  const { t: tc } = useTranslation('common')
  const { goToDetail, goToPreview, goToVersions } = useNavigateSms()
  const items = Array.isArray(templates) ? templates : []
  const [pendingDelete, setPendingDelete] = useState<SmsTemplate | null>(null)

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: SmsTemplate, b: SmsTemplate) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (template: SmsTemplate) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => goToDetail(template.id)}
          >
            {template.name}
          </button>
        ),
      },
      dateSortColumn<SmsTemplate>(
        'updated',
        'Updated',
        (item) => item.updatedAt,
        (iso) => formatDisplayDateTime(iso, i18n.language),
      ),
    ],
    [goToDetail, i18n.language, tc],
  )

  function renderRowMenu(template: SmsTemplate) {
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
        {canDelete && template.scope === 'company' && !isDefault ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setPendingDelete(template)}
              disabled={isBusy}
            >
              {t('common:delete')}
            </DropdownMenuItem>
          </>
        ) : null}
      </ItemListMenu>
    )
  }

  function rowBody(template: SmsTemplate) {
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
    <>
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
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete
            ? t('deleteTitleNamed', { name: pendingDelete.name })
            : t('deleteTitle')
        }
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:delete')}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
        }}
      />
    </>
  )
}
