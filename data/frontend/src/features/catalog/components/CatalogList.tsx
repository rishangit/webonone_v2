import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListStatus,
  itemListThumbClassName,
  TagChip,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { CopyToAiMenuItem } from '@/features/shell/components/CopyToAiMenuItem'
import type { CatalogGalleryImage, CatalogItem } from '@/shared/types/data.types'

const ENTITY_KIND_BY_ITEM_TYPE = {
  products: 'product',
  services: 'service',
  spaces: 'space',
} as const

function firstGalleryImageUrl(images: CatalogGalleryImage[] | null | undefined): string | null {
  const url = images?.[0]?.url
  return typeof url === 'string' && url.trim() ? url : null
}

type CatalogListKind = 'products' | 'services' | 'spaces'

interface CatalogListProps {
  itemType: CatalogListKind
  items: CatalogItem[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  onView?: (id: string) => void
  canEdit: boolean
  canDelete: boolean
}

export function CatalogList({
  itemType,
  items,
  onEdit,
  onDeleted,
  onVerify,
  onView,
  canEdit,
  canDelete,
}: CatalogListProps) {
  const { t } = useTranslation(itemType)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (items.length === 0) return <ItemListEmpty>{t('emptyFound')}</ItemListEmpty>

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const showMenu = Boolean(onView) || canEdit || canDelete
          const rowBody = (
            <>
              <ImagePreview
                src={firstGalleryImageUrl(item.galleryImages)}
                alt=""
                className={itemListThumbClassName}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {t('refs', { count: item.referenceCount ?? 0 })}
                  </span>
                </div>
                {item.description ? (
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {item.tags.length > 3 ? (
                    <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                  ) : null}
                </div>
              </div>
            </>
          )
          return (
            <ItemListItem key={item.id}>
              <ItemListContent>
                {onView ? (
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onView(item.id)}
                  >
                    {rowBody}
                  </button>
                ) : (
                  <div className="flex w-full items-start gap-3">{rowBody}</div>
                )}
              </ItemListContent>
              <ItemListStatus>
                <StatusBadge status={item.status} />
              </ItemListStatus>
              {showMenu ? (
                <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                  {onView ? (
                    <DropdownMenuItem onClick={() => onView(item.id)}>{t('viewDetails')}</DropdownMenuItem>
                  ) : null}
                  <CopyToAiMenuItem
                    kind={ENTITY_KIND_BY_ITEM_TYPE[itemType]}
                    id={item.id}
                    label={item.name}
                  />
                  {canDelete && item.status === 'pending' && onVerify ? (
                    <DropdownMenuItem onClick={() => onVerify(item.id)}>{t('verify')}</DropdownMenuItem>
                  ) : null}
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => onEdit(item.id)}>{t('common:edit')}</DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingDelete({ id: item.id, name: item.name })}
                      >
                        {t('common:delete')}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          )
        })}
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
