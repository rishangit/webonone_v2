import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import type { WebsitePage } from '../types'

interface WebsitePagesListProps {
  pages: WebsitePage[]
  view: 'list' | 'grid'
  canManage: boolean
  onOpen: (page: WebsitePage) => void
  onBrowse: (page: WebsitePage) => void
  onEditDetails: (page: WebsitePage) => void
  onDeleted: (id: string) => void
}

export function WebsitePagesList({
  pages,
  view,
  canManage,
  onOpen,
  onBrowse,
  onEditDetails,
  onDeleted,
}: WebsitePagesListProps) {
  const { t } = useTranslation('website')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (pages.length === 0) {
    return <ItemListEmpty>{t('emptyPages')}</ItemListEmpty>
  }

  const menu = (page: WebsitePage) =>
    canManage ? (
      <ItemListMenu ariaLabel={t('actionsFor', { name: page.name })}>
        <DropdownMenuItem onClick={() => onOpen(page)}>{t('openDesigner')}</DropdownMenuItem>
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
    ) : null

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

  if (view === 'grid') {
    return (
      <>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <li key={page.id}>
              <ItemListItem>
                <ItemListContent>
                  <button type="button" className="w-full text-left" onClick={() => onOpen(page)}>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{page.name}</p>
                      <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
                        {page.status === 'active' ? t('active') : t('inactive')}
                      </StatusTag>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.path || ''}</p>
                  </button>
                </ItemListContent>
                {menu(page)}
              </ItemListItem>
            </li>
          ))}
        </ul>
        {confirm}
      </>
    )
  }

  return (
    <>
      <ItemList>
        {pages.map((page) => (
          <ItemListItem key={page.id}>
            <ItemListContent>
              <button type="button" className="w-full text-left" onClick={() => onOpen(page)}>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{page.name}</p>
                  <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
                    {page.status === 'active' ? t('active') : t('inactive')}
                  </StatusTag>
                </div>
                <p className="text-sm text-muted-foreground">/{page.path || ''}</p>
              </button>
            </ItemListContent>
            {menu(page)}
          </ItemListItem>
        ))}
      </ItemList>
      {confirm}
    </>
  )
}
