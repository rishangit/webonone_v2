import { ItemList, ItemListContent, ItemListEmpty, ItemListItem } from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'

const KIND_LABEL: Record<CatalogSearchItem['kind'], string> = {
  products: 'Product',
  services: 'Service',
  spaces: 'Space',
}

type CatalogSearchResultsProps = {
  items: CatalogSearchItem[]
  searched: boolean
  error: string | null
}

export function CatalogSearchResults({ items, searched, error }: CatalogSearchResultsProps) {
  if (error) {
    return <ItemListEmpty>{error}</ItemListEmpty>
  }

  if (!searched) {
    return (
      <ItemListEmpty>Search products, services, and spaces from companies on WebOnOne.</ItemListEmpty>
    )
  }

  const rows = Array.isArray(items) ? items : []
  if (rows.length === 0) {
    return <ItemListEmpty>No matching offerings found. Try another search.</ItemListEmpty>
  }

  return (
    <ItemList>
      {rows.map((item) => (
        <ItemListItem key={`${item.kind}-${item.id}`}>
          <ItemListContent>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {KIND_LABEL[item.kind]}
              </span>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{item.companyName}</p>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            {item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                    style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </ItemListContent>
        </ItemListItem>
      ))}
    </ItemList>
  )
}
