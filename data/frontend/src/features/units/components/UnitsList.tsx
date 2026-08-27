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
  ItemListStatus,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CopyToAiMenuItem } from '@/features/shell/components/CopyToAiMenuItem'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Unit } from '@/shared/types/data.types'

interface UnitsListProps {
  items: Unit[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function UnitsList({ items, onEdit, onDeleted, onVerify, canMutate }: UnitsListProps) {
  const { t } = useTranslation('units')
  const { goToDetail } = useNavigateDataEntity()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  function openDetails(id: string) {
    goToDetail('units', id)
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
                <p className="font-medium">
                  {t('nameWithSymbol', { name: item.name, symbol: item.symbol })}
                </p>
                <span className="text-xs text-muted-foreground">
                  {t('refs', { count: item.referenceCount ?? 0 })}
                </span>
              </div>
              {item.description ? (
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {item.isBase ? t('baseUnitKind') : t('derivedKind')}
              </p>
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
              <ItemListStatus>
                <StatusBadge status={item.status} />
              </ItemListStatus>
              <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
                <DropdownMenuItem onClick={() => openDetails(item.id)}>
                  {t('viewDetails')}
                </DropdownMenuItem>
                <CopyToAiMenuItem kind="unit" id={item.id} label={item.name} />
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
                      {t('common:delete')}
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
