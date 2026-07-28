import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, Spinner } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogAttributeValueDialog } from '@/features/catalog/components/CatalogAttributeValueDialog'
import {
  getCatalogEntity,
  isCatalogEntityKind,
} from '@/features/catalog/utils/catalogAttributeApi'
import type { CatalogAttributeValue, CatalogAttributeValueEntry } from '@/shared/types/data.types'

/**
 * Peer-dialog body for add/edit attribute value (host owns header/footer).
 * Path: /embed/dialogs/:kind/:entityId/attributes/:attributeId/values/create
 *       /embed/dialogs/:kind/:entityId/attributes/:attributeId/values/:valueId/edit
 */
export function CatalogAttributeValueEmbedPage() {
  const { kind, entityId, attributeId, valueId } = useParams<{
    kind?: string
    entityId?: string
    attributeId?: string
    valueId?: string
  }>()
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  const [attribute, setAttribute] = useState<CatalogAttributeValue | null>(null)
  const [value, setValue] = useState<CatalogAttributeValueEntry | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isCatalogEntityKind(kind) || !entityId || !attributeId) {
      setLoadError('Invalid attribute value dialog route.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    void getCatalogEntity(kind, entityId)
      .then((item) => {
        if (cancelled) return
        const found = item.attributes.find((entry) => entry.attributeId === attributeId) ?? null
        if (!found) {
          setLoadError('Attribute not found on this item.')
          setAttribute(null)
          setValue(null)
          return
        }
        setAttribute(found)
        if (valueId) {
          const entry = found.values.find((v) => v.id === valueId) ?? null
          if (!entry) {
            setLoadError('Value not found.')
            setValue(null)
            return
          }
          setValue(entry)
        } else {
          setValue(null)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load attribute')
        setAttribute(null)
        setValue(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attributeId, entityId, kind, valueId])

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isCatalogEntityKind(kind) || !entityId || !attributeId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>Invalid attribute value dialog route.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    )
  }

  if (loadError || !attribute) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>{loadError ?? 'Attribute not found.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <CatalogAttributeValueDialog
      chrome="embed-page"
      open
      kind={kind}
      entityId={entityId}
      attribute={attribute}
      value={value}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSaved={() => {
        /* Keep open for further add/edit/remove; Close dismisses the host dialog. */
      }}
    />
  )
}
