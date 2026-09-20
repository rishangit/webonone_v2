import { useState } from 'react'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  ItemListMenuSeparator,
  StatusTag,
} from '@webonone/mobile-ui'
import type { FormTemplate } from '@/shared/types/design.types'

export function FormsList({
  items,
  canManage,
  busyId,
  onOpen,
  onDelete,
}: {
  items: FormTemplate[]
  canManage: boolean
  busyId: string | null
  onOpen: (form: FormTemplate) => void
  onDelete: (form: FormTemplate) => void
}) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const [pendingDelete, setPendingDelete] = useState<FormTemplate | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{t('emptyCreate')}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((form) => {
          const isBusy = busyId === form.id
          const fieldCount = form.definition?.fields?.length ?? 0
          return (
            <ItemListItem key={form.id}>
              <Pressable className="min-w-0 flex-1" onPress={() => onOpen(form)}>
                <ItemListContent
                  title={form.name}
                  subtitle={`${form.slug} · ${t('fields', { count: fieldCount })}`}
                />
              </Pressable>
              <StatusTag variant={form.status === 'published' ? 'approved' : 'pending'}>
                {form.status === 'published' ? t('published') : t('draft')}
              </StatusTag>
              {canManage ? (
                <ItemListMenu ariaLabel={t('actionsFor', { name: form.name })}>
                  <ItemListMenuItem disabled={isBusy} onPress={() => onOpen(form)}>
                    {tc('edit')}
                  </ItemListMenuItem>
                  <ItemListMenuSeparator />
                  <ItemListMenuItem
                    disabled={isBusy}
                    destructive
                    onPress={() => setPendingDelete(form)}
                  >
                    {tc('delete')}
                  </ItemListMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          )
        })}
      </ItemList>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={
          pendingDelete
            ? t('deleteConfirm', { name: pendingDelete.name })
            : t('deleteConfirmFallback')
        }
        description={t('deleteDescription')}
        confirmLabel={tc('delete')}
        destructive
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
