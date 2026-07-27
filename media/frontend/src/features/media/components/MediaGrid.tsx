import { useState } from 'react'
import { Check, MoreVertical } from 'lucide-react'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ItemListEmpty,
} from '@webonone/ui-kit'
import { MediaDeleteDialog } from './MediaDeleteDialog'

interface MediaGridProps {
  items: MediaItemDto[]
  selectedIds: Set<string>
  onToggleSelect: (item: MediaItemDto) => void
  onDelete: (id: string) => void | Promise<void>
  selectionEnabled?: boolean
}

export function MediaGrid({
  items,
  selectedIds,
  onToggleSelect,
  onDelete,
  selectionEnabled = true,
}: MediaGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<MediaItemDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = Array.isArray(items) ? items : []

  if (!rows.length) {
    return <ItemListEmpty>No media in this folder.</ItemListEmpty>
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((item) => {
          const isSelected = selectedIds.has(item.id)
          const isImage = item.mimeType.startsWith('image/')

          return (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-lg border ${
                isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border'
              }`}
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => selectionEnabled && onToggleSelect(item)}
                disabled={!selectionEnabled}
              >
                <div className="aspect-square bg-muted">
                  {isImage ? (
                    <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-xs text-muted-foreground">
                      {item.fileName}
                    </div>
                  )}
                </div>
                <p className="truncate px-2 py-1 text-xs">{item.fileName}</p>
              </button>
              {isSelected ? (
                <Check
                  className="pointer-events-none absolute bottom-7 right-1.5 h-5 w-5 rounded-full bg-background/90 p-0.5 text-primary shadow-sm"
                  aria-hidden
                />
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Actions for ${item.fileName}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
      <MediaDeleteDialog
        open={deleteTarget !== null}
        fileName={deleteTarget?.fileName ?? null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
