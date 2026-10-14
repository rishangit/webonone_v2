import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Pagination, Spinner, cn } from '@webonone/ui-kit'
import { websiteScrollportClassName } from '@/features/shell/layout/shellLayout'
import { catalogApi } from '@/features/catalog/services/catalogApi'
import type { CatalogSearchItem, NearbyCompanyGroup } from '@/features/catalog/types/catalog.types'
import {
  CatalogSearchMapView,
  type CatalogMapCompany,
} from '@/features/website/components/CatalogSearchMapView'
import { CatalogSearchResults } from '@/features/website/components/CatalogSearchResults'
import { CurrentLocationBar } from '@/features/website/components/CurrentLocationBar'
import { LocationPermissionDialog } from '@/features/website/components/LocationPermissionDialog'
import { NearbyHomeSection } from '@/features/website/components/NearbyHomeSection'
import { WebsiteHomeSearchForm } from '@/features/website/components/WebsiteHomeSearchForm'
import { useUserLocation } from '@/features/website/hooks/useUserLocation'
import {
  websiteHomePageInsetClassName,
  websitePageContentClassName,
} from '@/features/website/layout/websitePageContent'

const PAGE_SIZE = 20

const homeContentClassName = cn(
  websitePageContentClassName,
  websiteHomePageInsetClassName,
)

const resultsScrollMainClassName = cn(
  'relative z-10 min-h-0 flex-1 overflow-y-auto pb-12',
  websiteScrollportClassName,
)

type ResultsView = 'list' | 'map'

function parseView(value: string | null): ResultsView {
  return value === 'map' ? 'map' : 'list'
}

export function WebsiteHomePage() {
  const { t: tHome } = useTranslation('home')
  const { t: tSearch } = useTranslation('search')
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = (searchParams.get('q') ?? '').trim()
  const resultsView = parseView(searchParams.get('view'))
  const focusKey = searchParams.get('focus')
  const hasSearchQuery = urlQuery.length > 0
  const isMapView = resultsView === 'map'

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
  const [nearbyCompanies, setNearbyCompanies] = useState<NearbyCompanyGroup[]>([])
  const [nearbyMapLoading, setNearbyMapLoading] = useState(false)
  const [nearbyMapError, setNearbyMapError] = useState<string | null>(null)

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
      setError(err instanceof Error ? err.message : tSearch('failedSearch'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setDraftQuery(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    if (!hasSearchQuery) {
      setActiveQuery('')
      setItems([])
      setTotal(0)
      setPage(1)
      setSearched(false)
      setError(null)
      rankedWithLocationRef.current = false
      return
    }
    void runSearch(urlQuery, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch when URL query changes
  }, [urlQuery, hasSearchQuery])

  useEffect(() => {
    if (locationStatus !== 'ready' || !coords || !activeQuery || rankedWithLocationRef.current) {
      return
    }
    void runSearch(activeQuery, 1, coords)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-rank when location becomes ready
  }, [locationStatus, coords, activeQuery])

  useEffect(() => {
    if (!isMapView || hasSearchQuery || !coords) {
      if (!isMapView || hasSearchQuery) {
        setNearbyCompanies([])
        setNearbyMapError(null)
        setNearbyMapLoading(false)
      }
      return
    }

    let cancelled = false
    setNearbyMapLoading(true)
    setNearbyMapError(null)
    void catalogApi
      .nearby({ lat: coords.lat, lng: coords.lng })
      .then((result) => {
        if (cancelled) return
        setNearbyCompanies(Array.isArray(result.companies) ? result.companies : [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setNearbyCompanies([])
        setNearbyMapError(err instanceof Error ? err.message : tHome('nearbyFailed'))
      })
      .finally(() => {
        if (!cancelled) setNearbyMapLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isMapView, hasSearchQuery, coords, coords?.lat, coords?.lng, tHome])

  const mapCompanies = useMemo((): CatalogMapCompany[] => {
    return nearbyCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.description,
      latitude: company.latitude,
      longitude: company.longitude,
      distanceKm: company.distanceKm,
    }))
  }, [nearbyCompanies])

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
    if (!trimmed) {
      updateParams({ q: '', focus: null })
      return
    }
    if (trimmed === urlQuery) {
      void runSearch(trimmed, 1)
      return
    }
    updateParams({ q: trimmed, focus: null })
  }

  function handleClearSearch() {
    setDraftQuery('')
    updateParams({ q: '', focus: null })
  }

  function setView(view: ResultsView) {
    updateParams({ view, focus: null, replace: true })
  }

  const showSearchMap = isMapView && hasSearchQuery && searched && !error
  const showNearbyMap = isMapView && !hasSearchQuery && coords != null

  const listMapNav = (
    <nav className="flex items-center gap-3" aria-label={tSearch('resultsViewAria')}>
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
        {tSearch('listView')}
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
        {tSearch('mapView')}
      </button>
    </nav>
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <LocationPermissionDialog
        open={showPermissionPrompt}
        blocked={permissionDenied}
        onAllow={requestLocation}
        onNotNow={dismissPermissionPrompt}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {showSearchMap || showNearbyMap ? (
          <div className="absolute inset-0 z-0">
            <CatalogSearchMapView
              items={showSearchMap ? items : []}
              companies={showNearbyMap ? mapCompanies : undefined}
              userCoords={coords}
              variant="fullscreen"
              focusKey={focusKey}
            />
          </div>
        ) : null}

        <div
          className={`relative z-10 shrink-0 pt-4 sm:pt-6 ${
            isMapView ? 'bg-background/85 backdrop-blur-md' : 'bg-background'
          }`}
        >
          <div className={cn('flex flex-col gap-2', homeContentClassName)}>
            <WebsiteHomeSearchForm
              value={draftQuery}
              onChange={setDraftQuery}
              onClear={handleClearSearch}
              onSubmit={handleSubmit}
              loading={loading}
              hasActiveSearch={hasSearchQuery}
            />

            <CurrentLocationBar
              coords={coords}
              placeLabel={placeLabel}
              status={locationStatus}
              source={locationSource}
              permissionDenied={permissionDenied}
              showPermissionPrompt={showPermissionPrompt}
              onOpenPermissionPrompt={openPermissionPrompt}
              onRetry={requestLocation}
              trailing={listMapNav}
            />

            {!isMapView && activeQuery ? (
              <h2 className="pb-2 text-sm font-medium text-muted-foreground">
                {tSearch('resultsFor', { query: activeQuery })}
                {searched && !loading ? ` · ${total}` : null}
              </h2>
            ) : null}
            {showNearbyMap ? (
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <h2 className="text-sm font-medium text-muted-foreground">{tHome('nearbyHeading')}</h2>
                {nearbyMapLoading ? (
                  <Spinner size="sm" aria-hidden />
                ) : mapCompanies.length > 0 ? (
                  <span className="text-sm text-muted-foreground">· {mapCompanies.length}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {!isMapView ? (
          <main className={resultsScrollMainClassName}>
            <div className={cn('flex flex-col gap-6 py-4', homeContentClassName)}>
              {hasSearchQuery ? (
                <>
                  <CatalogSearchResults
                    items={items}
                    searched={searched}
                    error={error}
                    locationStatus={locationStatus}
                  />
                  {searched && total > PAGE_SIZE ? (
                    <Pagination
                      className="mt-auto"
                      totalCount={total}
                      currentPage={page}
                      pageSize={PAGE_SIZE}
                      onPageChange={(nextPage) => {
                        void runSearch(activeQuery, nextPage)
                      }}
                      hideWhenSinglePage
                    />
                  ) : null}
                </>
              ) : (
                <NearbyHomeSection coords={coords} locationStatus={locationStatus} />
              )}
            </div>
          </main>
        ) : null}

        {isMapView && hasSearchQuery && !showSearchMap ? (
          <main className={resultsScrollMainClassName}>
            <div className={homeContentClassName}>
              <CatalogSearchResults
                items={items}
                searched={searched}
                error={error}
                locationStatus={locationStatus}
              />
            </div>
          </main>
        ) : null}

        {isMapView && !hasSearchQuery && !coords ? (
          <main className={resultsScrollMainClassName}>
            <div className={homeContentClassName}>
              <p className="text-sm text-muted-foreground">{tHome('nearbyNeedsLocation')}</p>
            </div>
          </main>
        ) : null}

        {isMapView && !hasSearchQuery && coords && nearbyMapError ? (
          <main className={resultsScrollMainClassName}>
            <div className={homeContentClassName}>
              <p className="text-sm text-destructive">{nearbyMapError}</p>
            </div>
          </main>
        ) : null}

        {isMapView && !hasSearchQuery && coords && !nearbyMapLoading && mapCompanies.length === 0 && !nearbyMapError ? (
          <main className={resultsScrollMainClassName}>
            <div className={homeContentClassName}>
              <p className="text-sm text-muted-foreground">{tHome('nearbyEmpty')}</p>
            </div>
          </main>
        ) : null}
      </div>
    </div>
  )
}
