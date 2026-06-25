import { CustomDialog } from '@webonone/ui-kit'
import type { MediaItemDto } from '@webonone/media-embed'

interface MediaPreviewDialogProps {
  item: MediaItemDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MediaPreviewDialog({ item, open, onOpenChange }: MediaPreviewDialogProps) {
  const isImage = item?.mimeType.startsWith('image/')

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item?.fileName ?? 'Preview'}
      sizeWidth="large"
      sizeHeight="large"
      disableContentScroll
    >
      <div className="flex h-full min-h-[320px] items-center justify-center bg-muted/20 p-4">
        {item && isImage ? (
          <img
            src={item.url}
            alt={item.fileName}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
        )}
      </div>
    </CustomDialog>
  )
}
