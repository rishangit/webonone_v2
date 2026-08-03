import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@webonone/ui-kit'
import { resolvePlatformEmbedParentOrigin } from './embedSession'
import { PLATFORM_ALERT_CONFIRM_PATH } from './types'
import { useRequestPlatformPeerDialog } from './useRequestPlatformPeerDialog'

export type PlatformAlertConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  /** Per-service allowlist for embedded parent origin. */
  isAllowedParentOrigin: (origin: string) => boolean
  /** Primary action label (default Delete). */
  submitLabel?: string
  cancelLabel?: string
}

/**
 * Shared strict confirm for any microservice.
 * Standalone: local UI Kit AlertDialog.
 * Embedded in WebOnOne: shell-hosted AlertDialog via peer-dialog `variant: 'alert'`.
 */
export function PlatformAlertConfirmDialog({
  open,
  title,
  description,
  onOpenChange,
  onConfirm,
  isAllowedParentOrigin,
  submitLabel = 'Delete',
  cancelLabel = 'Cancel',
}: PlatformAlertConfirmDialogProps) {
  const parentOrigin =
    typeof window !== 'undefined'
      ? resolvePlatformEmbedParentOrigin(
          new URLSearchParams(window.location.search),
          isAllowedParentOrigin,
        )
      : null

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin,
    open,
    path: PLATFORM_ALERT_CONFIRM_PATH,
    variant: 'alert',
    title,
    description,
    submitLabel,
    cancelLabel,
    sizeWidth: 'auto',
    sizeHeight: 'auto',
    onResult: () => {
      onConfirm()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

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
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
              onOpenChange(false)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            {submitLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
