import { MediaPicker } from '../components/MediaPicker'
import { LibraryEmbedDemos } from '../components/LibraryEmbedDemos'

const LIBRARY_SCOPE = 'media:library:default'

export function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and manage files in your scoped library.
        </p>
      </div>
      <LibraryEmbedDemos />
      <MediaPicker
        scope={LIBRARY_SCOPE}
        folderPath="/"
        accept="*/*"
        maxFiles={10}
        mode="multiple"
      />
    </div>
  )
}
