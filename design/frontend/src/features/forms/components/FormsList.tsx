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
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { FormTemplate } from '@/shared/types/design.types'

interface FormsListProps {
  forms: FormTemplate[]
  onOpen: (form: FormTemplate) => void
  onDeleted: (id: string) => void
  canManage: boolean
}

export function FormsList({ forms, onOpen, onDeleted, canManage }: FormsListProps) {
  const { t } = useTranslation('forms')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (forms.length === 0) {
    return <ItemListEmpty>{t('emptyCreate')}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {forms.map((form) => (
          <ItemListItem key={form.id}>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(form)}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{form.name}</p>
                  <StatusTag variant={form.status === 'published' ? 'approved' : 'pending'}>
                    {form.status === 'published' ? t('published') : t('draft')}
                  </StatusTag>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.slug} · {t('fields', { count: form.definition.fields.length })}
                </p>
              </button>
            </ItemListContent>
            {canManage ? (
              <ItemListMenu ariaLabel={t('actionsFor', { name: form.name })}>
                <DropdownMenuItem onClick={() => onOpen(form)}>{t('common:edit')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setPendingDelete({ id: form.id, name: form.name })}
                >
                  {t('common:delete')}
                </DropdownMenuItem>
              </ItemListMenu>
            ) : null}
          </ItemListItem>
        ))}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? t('deleteConfirm', { name: pendingDelete.name }) : t('deleteConfirmFallback')}
        description={t('deleteDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) onDeleted(pendingDelete.id)
        }}
      />
    </>
  )
}
