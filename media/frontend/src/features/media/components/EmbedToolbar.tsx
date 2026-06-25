import { FolderPlus, Upload } from 'lucide-react'
import { Button } from '@webonone/ui-kit'

interface EmbedToolbarProps {
  onCreateFolder: () => void
  onUpload: () => void
  disableCreateFolder?: boolean
}

export function EmbedToolbar({
  onCreateFolder,
  onUpload,
  disableCreateFolder,
}: EmbedToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      <Button type="button" size="sm" variant="outline" onClick={onCreateFolder} disabled={disableCreateFolder}>
        <FolderPlus className="mr-1.5 h-4 w-4" aria-hidden />
        New folder
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onUpload}>
        <Upload className="mr-1.5 h-4 w-4" aria-hidden />
        Upload
      </Button>
    </div>
  )
}
