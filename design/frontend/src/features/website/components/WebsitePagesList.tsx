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
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (pages.length === 0) {
    return <ItemListEmpty>{t('emptyPages')}</ItemListEmpty>
  }

  const menu = (page: WebsitePage) =>
    canManage ? (
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

  return (
    <>
      <ItemList>
        {pages.map((page) => (
          <ItemListItem key={page.id}>
            <ItemListContent>
              <a
                href={websiteDesignerUrl('pages', page.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{page.name}</p>
                  <StatusTag variant={page.status === 'active' ? 'approved' : 'pending'}>
                    {page.status === 'active' ? t('active') : t('inactive')}
                  </StatusTag>
                </div>
                <p className="text-sm text-muted-foreground">/{page.path || ''}</p>
              </a>
            </ItemListContent>
            {menu(page)}
          </ItemListItem>
        ))}
      </ItemList>
      {confirm}
    </>
  )
}
