import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Callout,
  CalloutDescription,
  CalloutTitle,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  Spinner,
  cn,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { websiteColorLibraryActions } from '../../store'
import type { WebsiteColorLibraryItem } from '../../types'
import { ColorPaletteSwatchStrip } from '../ColorPaletteSwatchStrip'

export function ThemeColorLibraryPicker({
  appliedLibraryPaletteIds = [],
  selectedId,
  onSelectId,
  libraryError,
  loadOnMount = true,
}: {
  appliedLibraryPaletteIds?: string[]
  selectedId: string | null
  onSelectId: (id: string) => void
  libraryError?: string
  loadOnMount?: boolean
}) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const colorLibrary = useAppSelector((state) => state.websiteColorLibrary)
  const isSuperAdmin = useAppSelector((state) => state.auth.user?.role === 'super_admin')

  useEffect(() => {
    if (!loadOnMount) return
    dispatch(websiteColorLibraryActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
  }, [dispatch, loadOnMount])

  const appliedIdSet = new Set(appliedLibraryPaletteIds)

  function isLibraryPaletteTaken(item: WebsiteColorLibraryItem) {
    return appliedIdSet.has(item.id)
  }

  return (
    <div className="space-y-3">
      {isSuperAdmin ? (
        <Callout>
          <CalloutTitle>{t('colorLibrarySuperAdminTitle')}</CalloutTitle>
          <CalloutDescription>{t('colorLibrarySuperAdminMessage')}</CalloutDescription>
        </Callout>
      ) : (
        <p className="text-sm text-muted-foreground">{t('pickColorPaletteHint')}</p>
      )}
      {libraryError ? (
        <p className="text-sm text-destructive" role="alert">
          {libraryError}
        </p>
      ) : null}
      {colorLibrary.listStatus === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{colorLibrary.listError ?? t('colorLibraryLoadFailed')}</AlertDescription>
        </Alert>
      ) : null}
      {colorLibrary.listStatus === 'loading' && colorLibrary.items.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : colorLibrary.items.length === 0 ? (
        <ItemListEmpty>{isSuperAdmin ? t('colorLibraryEmptySuperAdmin') : t('colorLibraryEmpty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {colorLibrary.items.map((item) => {
            const alreadyAdded = isLibraryPaletteTaken(item)
            const selected = selectedId === item.id
            const marked = selected || alreadyAdded
            return (
              <ItemListItem
                key={item.id}
                role="button"
                tabIndex={alreadyAdded ? -1 : 0}
                aria-pressed={marked}
                aria-disabled={alreadyAdded}
                className={cn('cursor-pointer transition-colors', marked && itemListRowActiveClassName)}
                onClick={() => {
                  if (alreadyAdded) return
                  onSelectId(item.id)
                }}
                onKeyDown={(event) => {
                  if (alreadyAdded) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectId(item.id)
                  }
                }}
              >
                <ItemListContent>
                  <div className="flex items-center gap-3">
                    <ColorPaletteSwatchStrip palette={item.palette} sizeClassName="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {alreadyAdded
                          ? t('colorPaletteAlreadyOnTheme')
                          : t('colorPaletteColorCount', { count: item.palette.colors.length })}
                      </p>
                    </div>
                  </div>
                </ItemListContent>
                {marked ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
              </ItemListItem>
            )
          })}
        </ItemList>
      )}
    </div>
  )
}
