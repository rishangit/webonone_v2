import { useParams } from 'react-router-dom'
import { isWebsiteLibraryKind } from '../store/websiteLibraryCopyStore'
import { WebsiteLibraryPickerDialog } from '../components/WebsiteLibraryPickerDialog'

export function WebsiteLibraryPickerEmbedPage() {
  const { kind } = useParams<{ kind: string }>()
  if (!isWebsiteLibraryKind(kind)) return null
  return (
    <WebsiteLibraryPickerDialog
      kind={kind}
      open
      chrome="embed-page"
      onOpenChange={() => undefined}
      onSelect={() => undefined}
    />
  )
}
