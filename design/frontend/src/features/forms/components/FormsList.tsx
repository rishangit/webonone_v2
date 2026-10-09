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
  const { t: tc } = useTranslation('common')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: FormTemplate, b: FormTemplate) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (form: FormTemplate) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onOpen(form)}
          >
            {form.name}
          </button>
        ),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (form: FormTemplate) => (
          <StatusTag variant={form.status === 'published' ? 'approved' : 'pending'}>
            {form.status === 'published' ? t('published') : t('draft')}
          </StatusTag>
        ),
      },
    ],
    [onOpen, t, tc],
  )

  function renderRowMenu(form: FormTemplate) {
    if (!canManage) return null
    return (
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
    )
  }

  function rowBody(form: FormTemplate) {
    return (
      <>
        <div className="flex items-center gap-2">
          <p className="font-medium">{form.name}</p>
          <StatusTag variant={form.status === 'published' ? 'approved' : 'pending'}>
            {form.status === 'published' ? t('published') : t('draft')}
          </StatusTag>
        </div>
        <p className="text-sm text-muted-foreground">
          {form.slug} · {t('fields', { count: form.definition.fields.length })}
        </p>
      </>
    )
  }

  return (
    <>
      <CollectionListView
        items={forms}
        getRowKey={(form) => form.id}
        columns={columns}
        empty={<ItemListEmpty>{t('emptyCreate')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(form) => (
          <ItemListItem>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(form)}
              >
                {rowBody(form)}
              </button>
            </ItemListContent>
            {renderRowMenu(form)}
          </ItemListItem>
        )}
        renderCard={(form) => (
          <ItemListCollectionCard
            image={<ItemListCardPlaceholderImage alt={form.name} />}
            menu={renderRowMenu(form)}
            onBodyClick={() => onOpen(form)}
          >
            {rowBody(form)}
          </ItemListCollectionCard>
        )}
      />
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
