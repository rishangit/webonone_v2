import { useSearchParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'

export const CONFIRM_DELETE_EMBED_PATH = '/embed/dialogs/confirm-delete'

const CONFIRM_DELETE_SIZE = {
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

export type ConfirmDeleteDialogProps = {
  open: boolean
  title: string
  description: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  chrome?: 'dialog' | 'embed-page'
}

/**
 * Destructive delete confirm — AlertDialog standalone; peer-dialog when embedded in WebOnOne.
 */
export function ConfirmDeleteDialog({
  open,
  title,
  description,
  onOpenChange,
  onConfirm,
  chrome = 'dialog',
}: ConfirmDeleteDialogProps) {
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path: CONFIRM_DELETE_EMBED_PATH,
    title,
    description,
    submitLabel: 'Delete',
    ...CONFIRM_DELETE_SIZE,
    onResult: () => {
      onConfirm()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (!parentOrigin || !dialogRequestId) return
      sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId)
    },
  })

  if (chrome === 'embed-page') {
    return (
      <div className="flex w-full flex-col gap-4 p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">This cannot be undone.</p>
      </div>
    )
  }

  if (isHosted) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
              onOpenChange(false)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Embed body route for core-hosted delete confirms. */
export function ConfirmDeleteEmbedPage() {
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
    <ConfirmDeleteDialog
      chrome="embed-page"
      open
      title="Delete"
      description="This cannot be undone."
      onOpenChange={(next) => {
        if (!next) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onConfirm={() => {
        /* host primary → peer-dialog-submit → complete */
      }}
    />
  )
}
