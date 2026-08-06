import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useNavigateSms } from '@/features/shell/utils/navigateSms'
import type { SmsTemplate } from '@/shared/types/sms.types'

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function TemplatesList({
  templates,
  onEdit,
  onToggleActive,
  onDelete,
  busyId,
  canDelete,
}: TemplatesListProps) {
  const { t } = useTranslation('templates')
  const { goToDetail, goToPreview, goToVersions } = useNavigateSms()
  const items = Array.isArray(templates) ? templates : []
  const [pendingDelete, setPendingDelete] = useState<SmsTemplate | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{t('emptyScope')}</ItemListEmpty>
  }

  return (
    <>
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
                    {template.slug} · {formatScope(template, t)} ·{' '}
                    {template.isActive ? t('active') : t('inactive')} · Updated{' '}
                    {formatDate(template.updatedAt)}
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
                  Preview
                </DropdownMenuItem>
                {!isDefault ? (
                  <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                ) : null}
                {!isDefault ? (
                  <DropdownMenuItem onClick={() => goToVersions(template.id)} disabled={isBusy}>
                    Version history
                  </DropdownMenuItem>
                ) : null}
                {canDelete && template.scope === 'company' && !isDefault ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setPendingDelete(template)}
                      disabled={isBusy}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </ItemListMenu>
            </ItemListItem>
          )
        })}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete template?'}
        description="This action cannot be undone. The SMS template will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
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
