import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ItemListEmpty } from '@webonone/ui-kit'
import type { CatalogSearchItem } from '@/features/catalog/types/catalog.types'
import type { UserLocationCoords } from '@/features/website/hooks/useUserLocation'
import { getGoogleMapsApiKey } from '@/features/website/utils/googleMapsConfig'

type LatLng = { lat: number; lng: number }

type CatalogSearchMapViewProps = {
  items: CatalogSearchItem[]
  userCoords: UserLocationCoords | null
  /** `fullscreen` fills the parent; `embedded` is a bordered inset card. */
  variant?: 'embedded' | 'fullscreen'
  /** `${kind}-${id}` of the item to center and open on the map. */
  focusKey?: string | null
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: {
            center: LatLng
            zoom: number
            mapTypeControl?: boolean
            streetViewControl?: boolean
            fullscreenControl?: boolean
          },
        ) => {
          fitBounds: (bounds: unknown, padding?: number) => void
          setCenter: (latLng: LatLng) => void
          setZoom: (zoom: number) => void
        }
        Marker: new (opts: {
          map: unknown
          position: LatLng
          title?: string
          label?: string | { text: string; color?: string; fontSize?: string }
          icon?: {
            path: unknown
            scale?: number
            fillColor?: string
            fillOpacity?: number
            strokeColor?: string
            strokeWeight?: number
          }
        }) => {
          addListener: (event: string, handler: () => void) => void
          setMap: (map: unknown) => void
        }
        InfoWindow: new (opts?: { content?: string }) => {
          setContent: (content: string) => void
          open: (opts: { map: unknown; anchor: unknown }) => void
          close: () => void
        }
        LatLngBounds: new () => {
          extend: (point: LatLng) => void
          isEmpty: () => boolean
        }
        SymbolPath: { CIRCLE: unknown }
        event: {
          clearInstanceListeners: (instance: unknown) => void
        }
      }
    }
    __websiteMapsPromise?: Promise<void>
  }
}

function mapsApiReady(): boolean {
  return Boolean(window.google?.maps?.Map && window.google?.maps?.Marker)
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsApiReady()) return Promise.resolve()
  if (window.__websiteMapsPromise) return window.__websiteMapsPromise

  window.__websiteMapsPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (mapsApiReady()) {
        resolve()
        return
      }
      reject(new Error('Google Maps loaded without Map library'))
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-website-maps]')
    if (existing) {
      if (mapsApiReady()) {
        finish()
        return
      }
      existing.addEventListener('load', finish)
      existing.addEventListener('error', () => {
        window.__websiteMapsPromise = undefined
        reject(new Error('Failed to load Google Maps'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.dataset.websiteMaps = '1'
    script.onload = finish
    script.onerror = () => {
      window.__websiteMapsPromise = undefined
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return window.__websiteMapsPromise
}

function formatDistanceKm(
  distanceKm: number,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (distanceKm < 1) {
    return t('metersAway', { meters: String(Math.round(distanceKm * 1000)) })
  }
  return t('kmAway', { km: distanceKm.toFixed(1) })
}

function infoWindowHtml(
  item: CatalogSearchItem,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const distance =
    item.distanceKm != null
      ? `<div style="margin-top:4px;color:#666;font-size:12px">${formatDistanceKm(item.distanceKm, t)}</div>`
      : ''
  const detailHref = `/catalog/${encodeURIComponent(item.kind)}/${encodeURIComponent(item.id)}`
  return `<div style="max-width:220px;padding:2px 0">
    <div style="font-weight:600;font-size:13px">${escapeHtml(item.name)}</div>
    <div style="color:#555;font-size:12px;margin-top:2px">${escapeHtml(item.companyName)}</div>
    ${distance}
    <div style="margin-top:8px">
      <a href="${detailHref}" style="font-size:12px;font-weight:600;color:#111;text-decoration:underline">${escapeHtml(t('viewDetails'))}</a>
    </div>
  </div>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function CatalogSearchMapView({
  items,
  userCoords,
  variant = 'fullscreen',
  focusKey = null,
}: CatalogSearchMapViewProps) {
  const { t } = useTranslation('search')
  const { t: ts } = useTranslation('shell')
  const apiKey = getGoogleMapsApiKey()
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(mapsApiReady)
  const [loadError, setLoadError] = useState<string | null>(null)
  const isFullscreen = variant === 'fullscreen'

  const mappableItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.latitude != null &&
          item.longitude != null &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude),
      ),
    [items],
  )

  const focusItem = useMemo(
    () => (focusKey ? mappableItems.find((item) => `${item.kind}-${item.id}` === focusKey) : undefined),
    [focusKey, mappableItems],
  )

  useEffect(() => {
    if (!apiKey) return
    let cancelled = false
    void loadGoogleMaps(apiKey)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [apiKey])

  useEffect(() => {
    if (!ready || !apiKey || !mapRef.current || !window.google?.maps) return
    if (mappableItems.length === 0 && !userCoords) return

    const maps = window.google.maps
    const initialCenter = focusItem
      ? { lat: focusItem.latitude as number, lng: focusItem.longitude as number }
      : (userCoords ?? {
          lat: mappableItems[0]?.latitude ?? 0,
          lng: mappableItems[0]?.longitude ?? 0,
        })

    const map = new maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: focusItem ? 15 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    const bounds = new maps.LatLngBounds()
    const infoWindow = new maps.InfoWindow()
    const markers: Array<{ setMap: (map: unknown) => void }> = []
    let focusMarker: { addListener: (event: string, handler: () => void) => void } | null = null
    let focusContent: string | null = null

    for (const item of mappableItems) {
      const position = { lat: item.latitude as number, lng: item.longitude as number }
      const marker = new maps.Marker({
        map,
        position,
        title: `${item.name} — ${item.companyName}`,
      })
      const content = infoWindowHtml(item, t)
      marker.addListener('click', () => {
        infoWindow.setContent(content)
        infoWindow.open({ map, anchor: marker })
      })
      bounds.extend(position)
      markers.push(marker)

      if (focusItem && item.kind === focusItem.kind && item.id === focusItem.id) {
        focusMarker = marker
        focusContent = content
      }
    }

    if (userCoords) {
      const userMarker = new maps.Marker({
        map,
        position: userCoords,
        title: ts('yourLocation'),
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
      userMarker.addListener('click', () => {
        infoWindow.setContent(
          `<div style="font-weight:600;font-size:13px">${escapeHtml(ts('yourLocation'))}</div>`,
        )
        infoWindow.open({ map, anchor: userMarker })
      })
      bounds.extend(userCoords)
      markers.push(userMarker)
    }

    if (focusItem && focusMarker && focusContent) {
      map.setCenter({
        lat: focusItem.latitude as number,
        lng: focusItem.longitude as number,
      })
      map.setZoom(15)
      infoWindow.setContent(focusContent)
      infoWindow.open({ map, anchor: focusMarker })
    } else if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 64)
    }

    return () => {
      infoWindow.close()
      for (const marker of markers) {
        maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
      }
    }
  }, [ready, apiKey, mappableItems, userCoords, focusItem, t, ts])

  if (!apiKey) {
    return (
      <div className={isFullscreen ? 'flex h-full items-center justify-center bg-muted/40 p-6' : undefined}>
        <ItemListEmpty>{t('mapsKeyMissing')}</ItemListEmpty>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={isFullscreen ? 'flex h-full items-center justify-center bg-muted/40 p-6' : undefined}>
        <ItemListEmpty>{t('mapsLoadFailed')}</ItemListEmpty>
      </div>
    )
  }

  if (mappableItems.length === 0) {
    return (
      <div className={isFullscreen ? 'flex h-full items-center justify-center bg-muted/40 p-6' : undefined}>
        <ItemListEmpty>{t('noMapLocations')}</ItemListEmpty>
      </div>
    )
  }

  if (isFullscreen) {
    return <div ref={mapRef} className="h-full w-full bg-muted/40" />
  }

  // Embedded: map fills the parent (e.g. a Card); no extra frame so Card owns the border.
  return <div ref={mapRef} className="h-[min(50vh,22rem)] min-h-[16rem] w-full bg-muted/40" />
}
