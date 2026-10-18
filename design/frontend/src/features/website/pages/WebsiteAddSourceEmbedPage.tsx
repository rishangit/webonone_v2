import { useParams } from 'react-router-dom'
import { isWebsiteLibraryKind } from '../store/websiteLibraryCopyStore'
import { WebsiteAddSourceDialog } from '../components/WebsiteAddSourceDialog'

export function WebsiteAddSourceEmbedPage() {
  const { kind } = useParams<{ kind: string }>()
  if (!isWebsiteLibraryKind(kind)) return null
  return (
    <WebsiteAddSourceDialog
      kind={kind}
      title=""
      open
      chrome="embed-page"
      onOpenChange={() => undefined}
      onChoose={() => undefined}
    />
  )
}
