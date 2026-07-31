export type CatalogKind = 'products' | 'services' | 'spaces'

export type CatalogSearchItem = {
  id: string
  kind: CatalogKind
  name: string
  description: string | null
  companyId: string
  companyName: string
  tags: Array<{ id: string; name: string; color?: string }>
}

export type CatalogSearchResult = {
  items: CatalogSearchItem[]
  total: number
  page: number
  pageSize: number
}
