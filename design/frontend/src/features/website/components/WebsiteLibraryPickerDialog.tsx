import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Button,
  CustomDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ListAddButton,
  SearchInput,
  cn,
  itemListRowActiveClassName,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { WebsiteLibraryKind } from '../api'
import {
  websiteLibraryBrowseActions,
  websiteLibraryCopyActions,
} from '../store/websiteLibraryCopyStore'

const PICKER_SIZE = { sizeWidth: 'medium' as const, sizeHeight: 'large' as const }

function libraryPickerPath(kind: WebsiteLibraryKind): string {
  return `/embed/dialogs/website/library/${kind}`
}

export function WebsiteLibraryCopyControl({ kind }: { kind: WebsiteLibraryKind }) {
  const { t } = useTranslation('website')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const copy = useAppSelector((state) => state.websiteLibraryCopy)

  useEffect(() => {
    if (copy.status === 'idle' || copy.kind !== kind) return
    if (copy.status === 'succeeded') {
      toast({ title: t('addedFromLibrary') })
      dispatch(websiteLibraryCopyActions.copyReset())
    } else if (copy.status === 'error') {
      toast({
        title: t('addFromLibraryFailed'),
        description: copy.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteLibraryCopyActions.copyReset())
    }
  }, [copy.error, copy.kind, copy.status, dispatch, kind, t, toast])

  return (
    <>
      <ListAddButton compactLabel={t('addFromLibrary')} onClick={() => setOpen(true)}>
        {t('addFromLibrary')}
      </ListAddButton>
      <WebsiteLibraryPickerDialog
        kind={kind}
        open={open}
        onOpenChange={setOpen}
        onSelect={(libraryId) => {
          dispatch(websiteLibraryCopyActions.copyRequested({ kind, libraryId }))
        }}
      />
    </>
  )
}

export function WebsiteLibraryPickerDialog({
  kind,
  open,
  onOpenChange,
  onSelect,
  chrome = 'dialog',
}: {
  kind: WebsiteLibraryKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (libraryId: string) => void
  chrome?: 'dialog' | 'embed-page'
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const dialogRequestId =
    chrome === 'embed-page' ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null) : null
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: libraryPickerPath(kind),
    title: t('addFromLibraryTitle'),
    description: t('addFromLibraryDescription'),
    submitLabel: t('addFromLibrary'),
    ...PICKER_SIZE,
    onResult: (payload) => {
      const libraryId = (payload as { libraryId?: string } | undefined)?.libraryId
      if (libraryId) onSelect(libraryId)
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    setSelectedId(null)
    setQuery('')
  }, [chrome, kind, open])

  function confirm() {
    if (!selectedId) return
    if (dialogRequestId && parentOrigin) {
      sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId, { libraryId: selectedId })
      return
    }
    onSelect(selectedId)
    onOpenChange(false)
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: confirm,
  })

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, !selectedId)
  }, [dialogRequestId, parentOrigin, selectedId])

  const body = (
    <WebsiteLibraryPickerList
      kind={kind}
      active={chrome === 'embed-page' || open}
      query={query}
      onQueryChange={setQuery}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  )

  if (chrome === 'embed-page') return body
  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('addFromLibraryTitle')}
      description={t('addFromLibraryDescription')}
      sizeWidth={PICKER_SIZE.sizeWidth}
      sizeHeight={PICKER_SIZE.sizeHeight}
      footer={
        <>
          <Button type="button" variant="outline" className="h-10 px-4" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button type="button" className="h-10" disabled={!selectedId} onClick={confirm}>
            {t('addFromLibrary')}
          </Button>
        </>
      }
    >
      {body}
    </CustomDialog>
  )
}

function WebsiteLibraryPickerList({
  kind,
  active,
  query,
  onQueryChange,
  selectedId,
  onSelect,
}: {
  kind: WebsiteLibraryKind
  active: boolean
  query: string
  onQueryChange: (value: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation('website')
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.websiteLibraryBrowse.items)
  const error = useAppSelector((state) => state.websiteLibraryBrowse.listError)

  useEffect(() => {
    if (!active) return
    const handle = window.setTimeout(() => {
      dispatch(
        websiteLibraryBrowseActions.loadListRequested({
          force: true,
          page: 1,
          pageSize: 48,
          extra: { kind, q: query },
        }),
      )
    }, 300)
    return () => window.clearTimeout(handle)
  }, [active, dispatch, kind, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <SearchInput
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onClear={() => onQueryChange('')}
        placeholder={t('searchLibrary')}
        aria-label={t('searchLibrary')}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ItemList>
        {items.length === 0 ? <ItemListEmpty>{t('emptyLibrary')}</ItemListEmpty> : null}
        {items.map((item) => {
          const selected = item.id === selectedId
          return (
            <ItemListItem
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={item.name}
              className={cn('cursor-pointer', selected && itemListRowActiveClassName)}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(item.id)
                }
              }}
            >
              <ItemListContent>
                <span className="font-medium text-foreground">{item.name}</span>
                {item.path ? <span className="block text-sm text-muted-foreground">/{item.path}</span> : null}
              </ItemListContent>
              {selected ? <Check className="ml-auto h-5 w-5 shrink-0 self-center text-primary" aria-hidden /> : null}
            </ItemListItem>
          )
        })}
      </ItemList>
    </div>
  )
}
