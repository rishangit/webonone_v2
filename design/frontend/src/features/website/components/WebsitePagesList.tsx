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
import { websiteDesignerUrl } from '@/features/shell/utils/navigateDesign'
import type { WebsitePage } from '../types'

interface WebsitePagesListProps {
  pages: WebsitePage[]
  canManage: boolean
  onBrowse: (page: WebsitePage) => void
  onEditDetails: (page: WebsitePage) => void
  onDeleted: (id: string) => void
}

export function WebsitePagesList({
  pages,
  canManage,
  onBrowse,
  onEditDetails,
  onDeleted,
}: WebsitePagesListProps) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: tc('name'),
        sortable: true,
        compare: (a: WebsitePage, b: WebsitePage) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
        cell: (page: WebsitePage) => (
          <a
            href={websiteDesignerUrl('pages', page.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            {page.name}
          </a>
        ),
      },
      {
        id: 'status',
        header: tc('status'),
        cell: (page: WebsitePage) => (
          <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
            {page.status === 'active' ? t('active') : t('inactive')}
          </StatusTag>
        ),
      },
    ],
    [t, tc],
  )

  function renderRowMenu(page: WebsitePage) {
    if (!canManage) return null
    return (
      <ItemListMenu ariaLabel={t('actionsFor', { name: page.name })}>
        <DropdownMenuItem asChild>
          <a href={websiteDesignerUrl('pages', page.id)} target="_blank" rel="noopener noreferrer">
            {t('openDesigner')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBrowse(page)}>{t('browseLive')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditDetails(page)}>{t('editDetails')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setPendingDelete({ id: page.id, name: page.name })}
        >
          {t('common:delete')}
        </DropdownMenuItem>
      </ItemListMenu>
    )
  }

  function rowBody(page: WebsitePage) {
    return (
      <>
        <div className="flex items-center gap-2">
          <p className="font-medium">{page.name}</p>
          <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
            {page.status === 'active' ? t('active') : t('inactive')}
          </StatusTag>
        </div>
        <p className="text-sm text-muted-foreground">
          /{page.path || ''}
          {page.layoutName ? ` · ${page.layoutName}` : ''}
        </p>
      </>
    )
  }

  const confirm = (
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
  )

  return (
    <>
      <CollectionListView
        items={pages}
        getRowKey={(page) => page.id}
        columns={columns}
        empty={<ItemListEmpty>{t('emptyPages')}</ItemListEmpty>}
        renderGridActions={renderRowMenu}
        renderListItem={(page) => (
          <ItemListItem>
            <ItemListContent>
              <a
                href={websiteDesignerUrl('pages', page.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left"
              >
                {rowBody(page)}
              </a>
            </ItemListContent>
            {renderRowMenu(page)}
          </ItemListItem>
        )}
        renderCard={(page) => (
          <ItemListCollectionCard
            image={<ItemListCardPlaceholderImage alt={page.name} />}
            menu={renderRowMenu(page)}
          >
            <a
              href={websiteDesignerUrl('pages', page.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left"
            >
              {rowBody(page)}
            </a>
          </ItemListCollectionCard>
        )}
      />
      {confirm}
    </>
  )
}
