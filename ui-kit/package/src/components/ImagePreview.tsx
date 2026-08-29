import { Image as ImageIcon, Pencil } from 'lucide-react'
import { shapeImageClassName } from '../lib/shape'
import { cn } from '../lib/utils'
import { Button } from './Button'

export type ImagePreviewMode = 'view' | 'edit'

export interface ImagePreviewProps {
  src: string | null
  alt: string
  fallback?: string
  mode?: ImagePreviewMode
  onEdit?: () => void
  className?: string
}

export function ImagePreview({
  src,
  alt,
  mode = 'view',
  onEdit,
  className,
}: ImagePreviewProps) {
  const showEditOverlay = mode === 'edit' && onEdit

  return (
    <div
      className={cn(
        'relative h-40 w-40 shrink-0 overflow-hidden border border-border bg-muted',
        shapeImageClassName,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted" aria-label={alt}>
          <ImageIcon
            className="h-[40%] w-[40%] max-h-10 max-w-10 text-muted-foreground"
            aria-hidden
          />
        </div>
      )}
      {showEditOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="shadow-md"
            aria-label="Edit image"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
