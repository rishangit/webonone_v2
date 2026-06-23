import {
  ItemList,
  ItemListContent,
  ItemListItem,
  itemListRowActiveClassName,
} from '@webonone/ui-kit'
import type { MediaFolderDto } from '../services/mediaApi'

interface FolderTreeProps {
  folders: MediaFolderDto[]
  currentPath: string
  onSelectFolder: (path: string) => void
}

export function FolderTree({ folders, currentPath, onSelectFolder }: FolderTreeProps) {
  const rows = Array.isArray(folders) ? folders : []

  return (
    <ItemList>
      <ItemListItem className={currentPath === '/' ? itemListRowActiveClassName : undefined}>
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
          className={currentPath === folder.path ? itemListRowActiveClassName : undefined}
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
