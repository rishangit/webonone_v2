import type { DataAiEntityKind } from '@webonone/platform-embed'
import { getDataApiBaseUrl } from '@/features/data/utils/dataConfig'

export type DataEntitySearchHit = {
  kind: DataAiEntityKind
  id: string
  label: string
}

const SEARCH_RESOURCES: { resource: string; kind: DataAiEntityKind }[] = [
  { resource: 'products', kind: 'product' },
  { resource: 'services', kind: 'service' },
  { resource: 'spaces', kind: 'space' },
  { resource: 'tags', kind: 'tag' },
  { resource: 'units', kind: 'unit' },
  { resource: 'attributes', kind: 'attribute' },
]

type ListResponse = {
  items?: { id: string; name: string }[]
}

async function searchResource(
  accessToken: string,
  resource: string,
  kind: DataAiEntityKind,
  q: string,
): Promise<DataEntitySearchHit[]> {
  const url = new URL(`${getDataApiBaseUrl().replace(/\/$/, '')}/${resource}`)
  url.searchParams.set('q', q)
  url.searchParams.set('pageSize', '5')
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    return []
  }
  const data = (await res.json()) as ListResponse
  return (data.items ?? []).map((item) => ({
    kind,
    id: item.id,
    label: item.name,
  }))
}

export async function searchDataEntities(accessToken: string, q: string): Promise<DataEntitySearchHit[]> {
  const query = q.trim()
  if (!query) {
    return []
  }
  const batches = await Promise.all(
    SEARCH_RESOURCES.map(({ resource, kind }) => searchResource(accessToken, resource, kind, query)),
  )
  return batches.flat().slice(0, 12)
}
