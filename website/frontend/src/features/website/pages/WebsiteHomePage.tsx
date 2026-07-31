import { type FormEvent, useState } from 'react'
import { Button, Pagination, SearchInput } from '@webonone/ui-kit'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import { CatalogSearchResults } from '@/features/website/components/CatalogSearchResults'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'

const PAGE_SIZE = 20

export function WebsiteHomePage() {
  const [draftQuery, setDraftQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [items, setItems] = useState<CatalogSearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(q: string, nextPage: number) {
    const trimmed = q.trim()
    if (!trimmed) {
      setActiveQuery('')
      setItems([])
      setTotal(0)
      setPage(1)
      setSearched(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await catalogApi.search({
        q: trimmed,
        page: nextPage,
        pageSize: PAGE_SIZE,
      })
      setActiveQuery(trimmed)
      setItems(result.items)
      setTotal(result.total)
      setPage(result.page)
      setSearched(true)
    } catch (err) {
      setItems([])
      setTotal(0)
      setSearched(true)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void runSearch(draftQuery, 1)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <WebsiteHeader className="sticky top-0 z-20" />

      <section className="relative flex min-h-[min(70vh,36rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--accent-primary)/0.18),_transparent_55%),linear-gradient(160deg,_hsl(var(--background))_0%,_hsl(var(--muted)/0.45)_50%,_hsl(var(--background))_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:18px_18px]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <p className="mb-3 text-sm font-medium tracking-wide text-muted-foreground">WebOnOne</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find what companies offer
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm text-muted-foreground sm:text-base">
            Search products, services, and spaces across approved companies.
          </p>

          <form
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
            onSubmit={handleSubmit}
          >
            <SearchInput
              className="flex-1"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onClear={() => setDraftQuery('')}
              placeholder="Search by name, description, or tag…"
              aria-label="Search catalog"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !draftQuery.trim()}>
              {loading ? 'Searching…' : 'Search'}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 sm:px-8">
        {activeQuery ? (
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Results for “{activeQuery}”
            {searched && !loading ? ` · ${total}` : null}
          </h2>
        ) : null}
        <CatalogSearchResults items={items} searched={searched} error={error} />
        {searched && total > PAGE_SIZE ? (
          <Pagination
            className="mt-4"
            totalCount={total}
            currentPage={page}
            pageSize={PAGE_SIZE}
            onPageChange={(nextPage) => {
              void runSearch(activeQuery, nextPage)
            }}
            hideWhenSinglePage
          />
        ) : null}
      </section>
    </div>
  )
}
