import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import { getDataOrigin } from '@/features/data/utils/dataConfig'
import { usePlatformPeerDialog } from '@/features/shell/PlatformPeerDialogContext'
import type { CatalogGalleryKind } from '../types/companyCatalog.types'

const ATTRIBUTE_VALUE_DIALOG_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

function attributeValueCreateEmbedPath(
  kind: CatalogGalleryKind,
  libraryEntityId: string,
  attributeId: string,
): string {
  return `/embed/dialogs/${kind}/${libraryEntityId}/attributes/${attributeId}/values/create`
}

function attributeValueEditEmbedPath(
  kind: CatalogGalleryKind,
  libraryEntityId: string,
  attributeId: string,
  valueId: string,
): string {
  return `/embed/dialogs/${kind}/${libraryEntityId}/attributes/${attributeId}/values/${valueId}/edit`
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `attr-value-dialog-${Date.now()}`
}

type UseCompanyCatalogAttributeValueDialogOptions = {
  kind: CatalogGalleryKind
  libraryEntityId: string | null
  attributeId: string
  attributeName: string
  onClosed: () => void
}

export function useCompanyCatalogAttributeValueDialog({
  kind,
  libraryEntityId,
  attributeId,
  attributeName,
  onClosed,
}: UseCompanyCatalogAttributeValueDialogOptions) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { openPeerDialog } = usePlatformPeerDialog()
  const dataOrigin = getDataOrigin().replace(/\/$/, '')

  const openDialog = useCallback(
    (valueId?: string) => {
      if (!libraryEntityId) return
      const path = valueId
        ? attributeValueEditEmbedPath(kind, libraryEntityId, attributeId, valueId)
        : attributeValueCreateEmbedPath(kind, libraryEntityId, attributeId)

      openPeerDialog(
        {
          type: PLATFORM_MESSAGE_TYPES.PEER_DIALOG_REQUEST,
          requestId: createRequestId(),
          path,
          title: valueId ? t('attributeDetail.editValueTitle') : t('attributeDetail.addValueTitle'),
          description: attributeName,
          submitLabel: null,
          cancelLabel: tc('close'),
          ...ATTRIBUTE_VALUE_DIALOG_SIZE,
        },
        {
          resolve: () => onClosed(),
          cancel: () => onClosed(),
        },
        dataOrigin,
      )
    },
    [
      attributeId,
      attributeName,
      dataOrigin,
      kind,
      libraryEntityId,
      onClosed,
      openPeerDialog,
      t,
      tc,
    ],
  )

  return {
    openAdd: () => openDialog(),
    openEdit: (valueId: string) => openDialog(valueId),
  }
}
