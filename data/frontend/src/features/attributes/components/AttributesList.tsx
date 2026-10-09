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
  ItemListStatus,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CopyToAiMenuItem } from '@/features/shell/components/CopyToAiMenuItem'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { Attribute } from '@/shared/types/data.types'

interface AttributesListProps {
  items: Attribute[]
  onEdit: (id: string) => void
  onDeleted: (id: string) => void
  onVerify?: (id: string) => void
  canMutate: boolean
}

export function AttributesList({
  items,
  onEdit,
  onDeleted,
  onVerify,
  canMutate,
}: AttributesListProps) {
  const { t } = useTranslation('attributes')
  const { t: tc } = useTranslation('common')
  const { goToDetail } = useNavigateDataEntity()
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  function openDetails(id: string) {
    goToDetail('attributes', id)
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: Attribute, b: Attribute) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (item: Attribute) => (
          <button
            type="button"
            className="rounded-md text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => openDetails(item.id)}
          >
            {item.name}
          </button>
        ),
      },
      {
        id: 'refs',
        header: 'Refs',
        sortable: true,
        compare: (a: Attribute, b: Attribute) => (a.referenceCount ?? 0) - (b.referenceCount ?? 0),
        cell: (item: Attribute) => t('refs', { count: item.referenceCount ?? 0 }),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (item: Attribute) => <StatusBadge status={item.status} />,
      },
    ],
    [t, tc],
  )

  function renderRowMenu(item: Attribute) {
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: item.name })}>
        <DropdownMenuItem onClick={() => openDetails(item.id)}>{t('viewDetails')}</DropdownMenuItem>
        <CopyToAiMenuItem kind="attribute" id={item.id} label={item.name} />
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
    )
  }

  function rowBody(item: Attribute) {
    return (
      <>
        <div className="flex items-center gap-2">
          <p className="font-medium">{item.name}</p>
          <span className="text-xs text-muted-foreground">
            {t('refs', { count: item.referenceCount ?? 0 })}
          </span>
        </div>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {item.valueType === 'number' ? t('number') : t('text')}
          {item.unit ? ` · ${item.unit.name} (${item.unit.symbol})` : ''}
        </p>
      </>
    )
  }

  return (
    <>
      <CollectionListView
        items={items}
        getRowKey={(item) => item.id}
        columns={columns}
        empty={<ItemListEmpty>{t('emptyFound')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(item) => (
          <ItemListItem>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openDetails(item.id)}
              >
                {rowBody(item)}
              </button>
            </ItemListContent>
            <ItemListStatus>
              <StatusBadge status={item.status} />
            </ItemListStatus>
            {renderRowMenu(item)}
          </ItemListItem>
        )}
        renderCard={(item) => (
          <ItemListCollectionCard
            image={<ItemListCardPlaceholderImage alt={item.name} />}
            menu={renderRowMenu(item)}
            onBodyClick={() => openDetails(item.id)}
          >
            {rowBody(item)}
            <div className="mt-2">
              <ItemListStatus>
                <StatusBadge status={item.status} />
              </ItemListStatus>
            </div>
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
