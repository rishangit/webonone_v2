import { useState } from 'react'
import { Pressable } from 'react-native'
import {
  ConfirmDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  StatusTag,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { CompanyCatalogCopyToAiMenuItem } from '@/features/data/company-catalog/components/CompanyCatalogCopyToAiMenuItem'
import type { CatalogKind } from '@/features/data/utils/dataPaths'
import type { HydratedCatalogItem } from '@/features/sales/types/catalog.types'

export function CompanyCatalogList({
  kind,
  items,
  busyId,
  canRemove,
  removeNoun,
  onOpen,
  onRemove,
  emptyMessage,
}: {
  kind: CatalogKind
  items: HydratedCatalogItem[]
  busyId: string | null
  canRemove: boolean
  removeNoun: string
  onOpen: (item: HydratedCatalogItem) => void
  onRemove: (item: HydratedCatalogItem) => void
  emptyMessage: string
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const [pendingRemove, setPendingRemove] = useState<HydratedCatalogItem | null>(null)

  if (items.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const isBusy = busyId === item.id
          const thumb = item.displayGalleryImages?.[0]?.url ?? null
          return (
            <ItemListItem key={item.id}>
              <ImagePreview src={thumb} alt={item.displayName} className="mr-3 h-10 w-10 rounded-md" />
              <Pressable className="min-w-0 flex-1" onPress={() => onOpen(item)}>
                <ItemListContent
                  title={item.displayName}
                  subtitle={item.displayDescription ?? undefined}
                />
              </Pressable>
              <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
              {item.libraryUnavailable ? (
                <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
              ) : null}
              <ItemListMenu ariaLabel={`${tc('actions')} ${item.displayName}`}>
                <CompanyCatalogCopyToAiMenuItem
                  kind={kind}
                  id={item.id}
                  label={item.displayName}
                />
                <ItemListMenuItem disabled={isBusy} onPress={() => onOpen(item)}>
                  {tc('details')}
                </ItemListMenuItem>
                {canRemove ? (
                  <ItemListMenuItem
                    disabled={isBusy}
                    destructive
                    onPress={() => setPendingRemove(item)}
                  >
                    {tc('remove')}
                  </ItemListMenuItem>
                ) : null}
              </ItemListMenu>
            </ItemListItem>
          )
        })}
      </ItemList>
      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        title={
          pendingRemove
            ? t('list.removeTitleNamed', { name: pendingRemove.displayName })
            : t('list.removeTitle', { noun: removeNoun })
        }
        description={t('list.removeDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={pendingRemove !== null && busyId === pendingRemove.id}
        onConfirm={() => {
          if (pendingRemove) onRemove(pendingRemove)
          setPendingRemove(null)
        }}
      />
    </>
  )
}
