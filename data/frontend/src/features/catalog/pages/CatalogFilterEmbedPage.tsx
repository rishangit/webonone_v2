import { useParams } from 'react-router-dom'
import { StatusFilterEmbedPage } from '@/shared/pages/StatusFilterEmbedPage'

export function CatalogFilterEmbedPage() {
  const { kind } = useParams<{ kind: string }>()
  const idPrefix = kind ?? 'catalog'

  return <StatusFilterEmbedPage idPrefix={idPrefix} translationNs={kind ?? 'products'} />
}
