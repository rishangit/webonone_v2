import type { MediaItemDto } from '@webonone/media-embed'
import { Button } from '@webonone/ui-kit'

interface MediaGridProps {
  items: MediaItemDto[]
  selectedIds: Set<string>
  onToggleSelect: (item: MediaItemDto) => void
  onDelete: (id: string) => void
  selectionEnabled?: boolean
}

export function MediaGrid({
  items,
  selectedIds,
  onToggleSelect,
  onDelete,
  selectionEnabled = true,
}: MediaGridProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No media in this folder.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => {
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
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute right-2 top-2 hidden group-hover:block"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </Button>
          </div>
        )
      })}
    </div>
  )
}
