import type { MediaFolderDto } from '../services/mediaApi'

interface FolderTreeProps {
  folders: MediaFolderDto[]
  currentPath: string
  onSelectFolder: (path: string) => void
}

export function FolderTree({ folders, currentPath, onSelectFolder }: FolderTreeProps) {
  return (
    <nav className="space-y-1">
      <button
        type="button"
        className={`block w-full rounded px-2 py-1 text-left text-sm ${
          currentPath === '/' ? 'bg-muted font-medium' : 'hover:bg-muted/60'
        }`}
        onClick={() => onSelectFolder('/')}
      >
        Root
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={`block w-full rounded px-2 py-1 text-left text-sm ${
            currentPath === folder.path ? 'bg-muted font-medium' : 'hover:bg-muted/60'
          }`}
          onClick={() => onSelectFolder(folder.path)}
        >
          {folder.name}
        </button>
      ))}
    </nav>
  )
}
