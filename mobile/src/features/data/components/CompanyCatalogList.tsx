import { useState } from 'react'
import {
  ConfirmDialog,
  ItemList,
  ItemListEmpty,
  ItemListMenu,
  ItemListMenuItem,
  StatusTag,
} from '@webonone/mobile-ui'
import { useTranslation } from 'react-i18next'
import { CompanyCatalogCopyToAiMenuItem } from '@/features/data/company-catalog/components/CompanyCatalogCopyToAiMenuItem'
import { CatalogEntityListRow } from '@/features/data/components/CatalogEntityListRow'
import { CompanyServiceListMeta } from '@/features/data/components/CompanyServiceListMeta'
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
          return (
            <CatalogEntityListRow
              key={item.id}
              thumbUrl={item.displayGalleryImages?.[0]?.url ?? null}
              name={item.displayName}
              subtitle={item.displayDescription ?? undefined}
              onOpen={() => onOpen(item)}
              trailing={
                <>
                  <StatusTag
                    variant={
                      item.webPublishStatus === 'published'
                        ? 'approved'
                        : item.webPublishStatus === 'completed'
                          ? 'verified'
                          : 'pending'
                    }
                  >
                    {t(
                      `detail.webPublish.${
                        item.webPublishStatus === 'published' || item.webPublishStatus === 'completed'
                          ? item.webPublishStatus
                          : 'draft'
                      }`,
                    )}
                  </StatusTag>
                  <StatusTag variant="verified">{t(`binding.${item.bindingMode}`)}</StatusTag>
                  {item.libraryUnavailable ? (
                    <StatusTag variant="pending">{t('list.libraryUnavailable')}</StatusTag>
                  ) : null}
                </>
              }
              menu={
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
              }
            >
              {kind === 'services' ? <CompanyServiceListMeta item={item} className="mt-1" /> : null}
            </CatalogEntityListRow>
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
