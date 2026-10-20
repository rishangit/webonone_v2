import type { DragEvent } from 'react'
import {
  ItemList,
  ItemListContent,
  ItemListItem,
  cn,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import type { MediaFolderDto } from '../services/mediaApi'
import { beginMediaDrag, endMediaDrag } from '../utils/mediaDrag'

interface FolderTreeProps {
  folders: MediaFolderDto[]
  currentPath: string
  dropTargetPath?: string | null
  onSelectFolder: (path: string) => void
  onDragOverFolder?: (event: DragEvent, path: string) => void
  onDragLeaveFolder?: (event: DragEvent, path: string) => void
  onDropOnFolder?: (event: DragEvent, path: string) => void
  onDragEnd?: () => void
}

export function FolderTree({
  folders,
  currentPath,
  dropTargetPath = null,
  onSelectFolder,
  onDragOverFolder,
  onDragLeaveFolder,
  onDropOnFolder,
  onDragEnd,
}: FolderTreeProps) {
  const rows = Array.isArray(folders) ? folders : []

  return (
    <ItemList>
      <ItemListItem
        className={cn(currentPath === '/' && itemListRowActiveClassName, dropTargetPath === '/' && 'ring-2 ring-primary')}
        onDragOver={(event) => onDragOverFolder?.(event, '/')}
        onDragLeave={(event) => onDragLeaveFolder?.(event, '/')}
        onDrop={(event) => onDropOnFolder?.(event, '/')}
      >
        <ItemListContent>
          <button
            type="button"
            className="w-full text-left text-sm font-medium"
            onClick={() => onSelectFolder('/')}
          >
            Root
          </button>
        </ItemListContent>
      </ItemListItem>
      {rows.map((folder) => (
        <ItemListItem
          key={folder.id}
          draggable
          className={cn(
            'cursor-grab active:cursor-grabbing',
            currentPath === folder.path && itemListRowActiveClassName,
            dropTargetPath === folder.path && 'ring-2 ring-primary',
          )}
          onDragStart={(event) => {
            beginMediaDrag({ kind: 'folder', id: folder.id, path: folder.path, name: folder.name })
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', folder.name)
          }}
          onDragEnd={() => {
            endMediaDrag()
            onDragEnd?.()
          }}
          onDragOver={(event) => onDragOverFolder?.(event, folder.path)}
          onDragLeave={(event) => onDragLeaveFolder?.(event, folder.path)}
          onDrop={(event) => onDropOnFolder?.(event, folder.path)}
        >
          <ItemListContent>
            <button
              type="button"
              className="w-full truncate text-left text-sm"
              onClick={() => onSelectFolder(folder.path)}
            >
              {folder.name}
            </button>
          </ItemListContent>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
