import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Pagination, SearchInput } from '@webonone/ui-kit'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import { CatalogSearchMapView } from '@/features/website/components/CatalogSearchMapView'
import { CatalogSearchResults } from '@/features/website/components/CatalogSearchResults'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { WebsiteHeader } from '@/features/website/components/WebsiteHeader'
import { useUserLocation } from '@/features/website/hooks/useUserLocation'

const PAGE_SIZE = 20

type ResultsView = 'list' | 'map'

function parseView(value: string | null): ResultsView {
  return value === 'map' ? 'map' : 'list'
}

export function CatalogSearchPage() {
  const { t } = useTranslation('search')
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = (searchParams.get('q') ?? '').trim()
  const resultsView = parseView(searchParams.get('view'))
  const focusKey = searchParams.get('focus')

  const {
    coords,
    placeLabel,
    status: locationStatus,
    source: locationSource,
    permissionDenied,
    showPermissionPrompt,
    requestLocation,
    openPermissionPrompt,
    dismissPermissionPrompt,
    waitForCoords,
  } = useUserLocation()

  const [draftQuery, setDraftQuery] = useState(urlQuery)
  const [activeQuery, setActiveQuery] = useState('')
  const [items, setItems] = useState<CatalogSearchItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rankedWithLocationRef = useRef(false)

  async function runSearch(
    q: string,
    nextPage: number,
    location?: { lat: number; lng: number } | null,
  ) {
    const trimmed = q.trim()
    if (!trimmed) {
      setActiveQuery('')
      setItems([])
      setTotal(0)
      setPage(1)
      setSearched(false)
      setError(null)
      rankedWithLocationRef.current = false
      return
    }

    setLoading(true)
    setError(null)
    try {
      let searchCoords = location === undefined ? coords : location
      // Wait briefly for geolocation on first search so distance is included when possible.
      if (searchCoords == null && location === undefined && locationStatus === 'pending') {
        searchCoords = await waitForCoords(8_000)
      }

      const result = await catalogApi.search({
        q: trimmed,
        page: nextPage,
        pageSize: PAGE_SIZE,
        lat: searchCoords?.lat,
        lng: searchCoords?.lng,
      })
      setActiveQuery(trimmed)
      setItems(result.items)
      setTotal(result.total)
      setPage(result.page)
      setSearched(true)
      rankedWithLocationRef.current = searchCoords != null
    } catch (err) {
      setItems([])
      setTotal(0)
      setSearched(true)
      setError(err instanceof Error ? err.message : t('failedSearch'))
    } finally {
      setLoading(false)
    }
  }

  // Sync draft input when URL q changes (e.g. browser back/forward).
  useEffect(() => {
    setDraftQuery(urlQuery)
  }, [urlQuery])

  // Run search when URL q changes.
  useEffect(() => {
    void runSearch(urlQuery, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when URL query changes
  }, [urlQuery])

  // Re-rank an active result set once geolocation becomes available.
  useEffect(() => {
    if (locationStatus !== 'ready' || !coords || !activeQuery || rankedWithLocationRef.current) {
      return
    }
    void runSearch(activeQuery, 1, coords)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-rank when location first becomes ready
  }, [locationStatus, coords, activeQuery])

  function updateParams(next: {
    q?: string
    view?: ResultsView
    focus?: string | null
    replace?: boolean
  }) {
    const params = new URLSearchParams(searchParams)
    if (next.q !== undefined) {
      const trimmed = next.q.trim()
      if (trimmed) params.set('q', trimmed)
      else params.delete('q')
    }
    if (next.view !== undefined) {
      if (next.view === 'list') params.delete('view')
      else params.set('view', next.view)
    }
    if (next.focus !== undefined) {
      if (next.focus) params.set('focus', next.focus)
      else params.delete('focus')
    }
    setSearchParams(params, { replace: next.replace ?? false })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = draftQuery.trim()
    if (!trimmed) return
    if (trimmed === urlQuery) {
      void runSearch(trimmed, 1)
      return
    }
    updateParams({ q: trimmed, focus: null })
  }

  function setView(view: ResultsView) {
    updateParams({ view, focus: null, replace: true })
  }

  function handleViewInMap(item: CatalogSearchItem) {
    updateParams({
      view: 'map',
      focus: `${item.kind}-${item.id}`,
      replace: true,
    })
  }

  const isMapView = resultsView === 'map'
  const showResultsChrome = searched && !error

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <WebsiteHeader className="shrink-0 z-20" />

      <LocationPermissionDialog
        open={showPermissionPrompt}
        blocked={permissionDenied}
        onAllow={requestLocation}
        onNotNow={dismissPermissionPrompt}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {isMapView && showResultsChrome ? (
          <div className="absolute inset-0 z-0">
            <CatalogSearchMapView
              items={items}
              userCoords={coords}
              variant="fullscreen"
              focusKey={focusKey}
            />
          </div>
        ) : null}

        <div
          className={`relative z-10 shrink-0 px-4 pt-2 sm:px-8 ${
            isMapView
              ? 'bg-background/85 backdrop-blur-md'
              : 'bg-background'
          }`}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
            <form
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
              onSubmit={handleSubmit}
            >
              <SearchInput
                className="flex-1"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onClear={() => setDraftQuery('')}
                placeholder={t('placeholder')}
                aria-label={t('searchAria')}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !draftQuery.trim()}>
                {loading ? t('loading') : t('cta')}
              </Button>
            </form>

            <CurrentLocationBar
              coords={coords}
              placeLabel={placeLabel}
              status={locationStatus}
              source={locationSource}
              permissionDenied={permissionDenied}
              showPermissionPrompt={showPermissionPrompt}
              onOpenPermissionPrompt={openPermissionPrompt}
              onRetry={requestLocation}
              trailing={
                <nav className="flex items-center gap-3" aria-label={t('resultsViewAria')}>
                  <button
                    type="button"
                    className={`text-sm font-medium underline-offset-4 transition-colors ${
                      resultsView === 'list'
                        ? 'text-foreground underline'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-current={resultsView === 'list' ? 'page' : undefined}
                    onClick={() => setView('list')}
                  >
                    {t('listView')}
                  </button>
                  <button
                    type="button"
                    className={`text-sm font-medium underline-offset-4 transition-colors ${
                      resultsView === 'map'
                        ? 'text-foreground underline'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-current={resultsView === 'map' ? 'page' : undefined}
                    onClick={() => setView('map')}
                  >
                    {t('mapView')}
                  </button>
                </nav>
              }
            />

            {!isMapView && activeQuery ? (
              <h2 className="pb-2 text-sm font-medium text-muted-foreground">
                {t('resultsFor', { query: activeQuery })}
                {searched && !loading ? ` · ${total}` : null}
              </h2>
            ) : null}
          </div>
        </div>

        {!isMapView ? (
          <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-12 sm:px-8">
            <div className="mx-auto w-full max-w-5xl">
              <CatalogSearchResults
                items={items}
                searched={searched || Boolean(urlQuery)}
                error={error}
                locationStatus={locationStatus}
                onViewInMap={handleViewInMap}
              />

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
            </div>
          </main>
        ) : null}

        {isMapView && !showResultsChrome ? (
          <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-12 sm:px-8">
            <div className="mx-auto w-full max-w-5xl">
              <CatalogSearchResults
                items={items}
                searched={searched || Boolean(urlQuery)}
                error={error}
                locationStatus={locationStatus}
                onViewInMap={handleViewInMap}
              />
            </div>
          </main>
        ) : null}
      </div>
    </div>
  )
}
