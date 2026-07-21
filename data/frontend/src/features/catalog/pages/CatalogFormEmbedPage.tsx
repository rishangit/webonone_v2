import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CatalogFormDialog } from '@/features/catalog/components/CatalogFormDialog'

const CATALOG_KINDS = new Set(['products', 'services', 'spaces'])

export function CatalogFormEmbedPage() {
  const { kind, id } = useParams<{ kind: string; id?: string }>()
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  if (!kind || !CATALOG_KINDS.has(kind) || !parentOrigin || !requestId) {
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

  return (
    <CatalogFormDialog
      chrome="embed-page"
      kind={kind as 'products' | 'services' | 'spaces'}
      open
      id={id}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSaved={() => sendPlatformPeerDialogComplete(parentOrigin, requestId)}
    />
  )
}
