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
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Tag } from '@/shared/types/data.types'

interface TagsListProps {
  items: Tag[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function TagsList({
  items,
  onEdit,
  onDeleted,
  onVerify,
  canMutate,
}: TagsListProps) {
  const { t } = useTranslation('tags')
  const { goToDetail } = useNavigateDataEntity()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  function openDetails(id: string) {
    goToDetail('tags', id)
  }

  if (items.length === 0) {
    return <ItemListEmpty>{t('emptyFound')}</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {items.map((item) => {
          const rowBody = (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: item.color }}
                />
                <p className="font-medium">{item.name}</p>
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground">
                  {t('refs', { count: item.referenceCount ?? 0 })}
                </span>
              </div>
              {item.description ? (
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </>
          )
          return (
            <ItemListItem key={item.id}>
              <ItemListContent>
                <button
                  type="button"
                  className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openDetails(item.id)}
                >
                  {rowBody}
                </button>
              </ItemListContent>
              <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                <DropdownMenuItem onClick={() => openDetails(item.id)}>
                  {t('viewDetails')}
                </DropdownMenuItem>
                {canMutate && item.status === 'pending' && onVerify ? (
                  <DropdownMenuItem onClick={() => onVerify(item.id)}>{t('verify')}</DropdownMenuItem>
                ) : null}
                {canMutate ? (
                  <DropdownMenuItem onClick={() => onEdit(item.id)}>{t('common:edit')}</DropdownMenuItem>
                ) : null}
                {canMutate ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setPendingDelete({ id: item.id, name: item.name })}
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
