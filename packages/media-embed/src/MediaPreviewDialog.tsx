import { useEffect, useRef, useState } from 'react'
import { Button, CustomDialog } from '@webonone/ui-kit'
import type { MediaItemDto } from './types'
import { useMediaEmbedMessage } from './useMediaEmbedMessage'

export interface MediaPreviewDialogProps {
  item: MediaItemDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  stackLevel?: number
  closeLabel?: string
}

/** Large preview so the whole image is visible (object-contain, not cropped). */
export function MediaPreviewDialog({
  item,
  open,
  onOpenChange,
  stackLevel = 0,
  closeLabel = 'Close',
}: MediaPreviewDialogProps) {
  const isImage = item?.mimeType.startsWith('image/') ?? false

  return (
    <CustomDialog
      open={open && item !== null}
      onOpenChange={onOpenChange}
      title={item?.fileName ?? 'Preview'}
      sizeWidth="large"
      sizeHeight="xlarge"
      stackLevel={stackLevel}
      disableContentScroll
      footer={
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={(event) => {
            event.stopPropagation()
            onOpenChange(false)
          }}
        >
          {closeLabel}
        </Button>
      }
    >
      <div className="absolute inset-0 flex items-center justify-center bg-muted/20 p-4">
        {item && isImage ? (
          <img src={item.url} alt={item.fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
        )}
      </div>
    </CustomDialog>
  )
}

export interface HostedMediaPreviewDialogProps {
  mediaOrigin: string
  stackLevel?: number
  closeLabel?: string
  /** True while the preview is open or closing, so the picker underneath stays open. */
  onGuardChange?: (guard: boolean) => void
}

/**
 * Listens for a preview request from a Media iframe and opens the large preview
 * in this document, above the picker dialog.
 */
export function HostedMediaPreviewDialog({
  mediaOrigin,
  stackLevel = 1,
  closeLabel = 'Close',
  onGuardChange,
}: HostedMediaPreviewDialogProps) {
  const [item, setItem] = useState<MediaItemDto | null>(null)
  const [blockDismiss, setBlockDismiss] = useState(false)
  const onGuardChangeRef = useRef(onGuardChange)
  const timerRef = useRef<number | null>(null)
  onGuardChangeRef.current = onGuardChange

  const guard = item !== null || blockDismiss

  useEffect(() => {
    onGuardChangeRef.current?.(guard)
  }, [guard])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
      onGuardChangeRef.current?.(false)
    }
  }, [])

  useMediaEmbedMessage({
    mediaOrigin,
    onPreviewRequest: (message) => {
      if (!message.item.mimeType.startsWith('image/')) return
      setItem(message.item)
    },
  })

  function closePreview() {
    setItem(null)
    setBlockDismiss(true)
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      setBlockDismiss(false)
      timerRef.current = null
    }, 150)
  }

  return (
    <MediaPreviewDialog
      item={item}
      open={item !== null}
      stackLevel={stackLevel}
      closeLabel={closeLabel}
      onOpenChange={(next) => {
        if (!next) closePreview()
      }}
    />
  )
}
