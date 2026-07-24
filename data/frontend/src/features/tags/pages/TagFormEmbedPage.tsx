import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { TagFormDialog } from '@/features/tags/components/TagFormDialog'

export function TagFormEmbedPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

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

  return (
    <TagFormDialog
      chrome="embed-page"
      open
      id={id}
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSaved={(tag) =>
        sendPlatformPeerDialogComplete(
          parentOrigin,
          requestId,
          tag
            ? { id: tag.id, name: tag.name, color: tag.color }
            : undefined,
        )
      }
    />
  )
}
