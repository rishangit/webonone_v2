import { Pencil } from 'lucide-react'
import { Avatar, Button } from '@webonone/ui-kit'

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

interface ProfileAvatarEditorProps {
  displayName: string
  avatarUrl: string | null
  onEditImage: () => void
}

export function ProfileAvatarEditor({
  displayName,
  avatarUrl,
  onEditImage,
}: ProfileAvatarEditorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        className="relative h-auto rounded-full p-0 hover:bg-transparent"
        onClick={onEditImage}
        aria-label="Change profile photo"
      >
        <Avatar
          size="xl"
          className="h-40 w-40 text-2xl"
          src={avatarUrl}
          alt={displayName}
          fallback={getInitials(displayName)}
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35">
          <Pencil className="h-8 w-8 text-white" aria-hidden />
        </span>
      </Button>
      <p className="text-xs text-muted-foreground">Click the photo to choose a new image</p>
    </div>
  )
}
