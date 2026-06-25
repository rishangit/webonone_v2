import { FileIcon, Pencil } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import { Button } from '@webonone/ui-kit'

interface MediaViewerProps {
  item: MediaItemDto | null
  mode: 'view' | 'edit'
  onEdit?: () => void
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function MediaViewer({ item, mode, onEdit }: MediaViewerProps) {
  if (!item) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        No media to display
      </div>
    )
  }

  const showEditOverlay = mode === 'edit' && onEdit

  return (
    <div className="relative flex h-full min-h-[200px] items-center justify-center rounded-lg border bg-muted/20 p-4">
      {isImageMime(item.mimeType) ? (
        <img
          src={item.url}
          alt={item.fileName}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileIcon className="h-16 w-16" aria-hidden />
          <p className="max-w-xs truncate text-sm font-medium text-foreground">{item.fileName}</p>
          <p className="text-xs">{item.mimeType}</p>
        </div>
      )}
      {showEditOverlay ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 shadow-md"
          aria-label="Change file"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
