import { ImagePreview } from '@webonone/ui-kit'

interface ProfileAvatarEditorProps {
  displayName: string
  avatarUrl: string | null
  onEditImage: () => void
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

export function ProfileAvatarEditor({
  displayName,
  avatarUrl,
  onEditImage,
}: ProfileAvatarEditorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ImagePreview
        src={avatarUrl}
        alt={displayName}
        fallback={getInitials(displayName)}
        mode="edit"
        onEdit={onEditImage}
        className="rounded-full"
      />
      <p className="text-xs text-muted-foreground">Click the edit button to choose a new image</p>
    </div>
  )
}
