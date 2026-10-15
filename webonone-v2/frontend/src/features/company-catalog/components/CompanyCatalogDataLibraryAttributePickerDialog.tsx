import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import { useToast } from '@webonone/ui-kit'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import { companyCatalogApi } from '../services/companyCatalogApi'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `data-attr-picker-${Date.now()}`
}

function parseSelectedAttributeIds(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('attributes' in payload)) return []
  const attributes = (payload as { attributes?: unknown }).attributes
  if (!Array.isArray(attributes)) return []
  return attributes.flatMap((item) => {
    if (!item || typeof item !== 'object' || !('id' in item)) return []
    const id = (item as { id?: unknown }).id
    return typeof id === 'string' && id.length > 0 ? [id] : []
  })
}

/**
 * Opens the shared Data "Add library attributes" dialog.
 * The same window is used by the super-admin product editor (step 3).
 */
export function CompanyCatalogDataLibraryAttributePickerDialog({
  open,
  kind,
  entityId,
  excludedAttributeIds,
  onOpenChange,
  onAttached,
}: {
  open: boolean
  kind: CatalogGalleryKind
  entityId: string
  excludedAttributeIds: string[]
  onOpenChange: (open: boolean) => void
  onAttached: (libraryEntityId: string) => void
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const { openPeerDialog } = usePlatformPeerDialog()
  const openedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      openedRef.current = false
      return
    }
    if (openedRef.current) return
    openedRef.current = true

    const excluded = new Set(excludedAttributeIds)
    const excludedQuery =
      excludedAttributeIds.length > 0
        ? `?excluded=${encodeURIComponent(excludedAttributeIds.join(','))}`
        : ''

    openPeerDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
        requestId: createRequestId(),
        path: `/embed/dialogs/attributes/select${excludedQuery}`,
        title: t('attributesTab.addToLibraryTitle'),
        description: t('attributesTab.addToLibraryDescription'),
        submitLabel: t('attributesTab.attachSelected', { count: 0 }),
        cancelLabel: tc('cancel'),
        sizeWidth: 'medium',
        sizeHeight: 'large',
      },
      {
        resolve: (payload) => {
          const ids = parseSelectedAttributeIds(payload).filter((id) => !excluded.has(id))
          if (ids.length === 0) {
            onOpenChange(false)
            return
          }
          void (async () => {
            try {
              const result = await companyCatalogApi.attachAttributesToLibrary(kind, entityId, ids)
              toast({ title: t('attributesTab.attachedToLibrary') })
              onAttached(result.libraryEntityId)
            } catch (err) {
              toast({
                title: t('attributesTab.attachFailed'),
                description: err instanceof Error ? err.message : undefined,
                variant: 'destructive',
              })
            } finally {
              onOpenChange(false)
            }
          })()
        },
        cancel: () => onOpenChange(false),
      },
      getDataOrigin().replace(/\/$/, ''),
    )
  }, [
    entityId,
    excludedAttributeIds,
    kind,
    onAttached,
    onOpenChange,
    open,
    openPeerDialog,
    t,
    tc,
    toast,
  ])

  return null
}
