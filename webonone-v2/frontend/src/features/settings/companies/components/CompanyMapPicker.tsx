import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@webonone/ui-kit'
import { getGoogleMapsApiKey } from '../utils/googleMapsConfig'

type LatLng = { lat: number; lng: number }

type PlaceResult = {
  latitude: number
  longitude: number
  mapPlaceId: string | null
  mapFormattedAddress: string | null
  addressLine1?: string
  city?: string
  stateRegion?: string
  postalCode?: string
  country?: string
}

type CompanyMapPickerProps = {
  mode: 'view' | 'edit'
  latitude: number | null
  longitude: number | null
  onPlaceSelected?: (place: PlaceResult) => void
  /** Grow the map canvas to fill available card height. */
  fillHeight?: boolean
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
          setCenter: (c: LatLng) => void
          setZoom: (z: number) => void
          addListener: (
            event: string,
            handler: (e: { latLng?: { lat: () => number; lng: () => number } }) => void,
          ) => void
        }
        Marker: new (opts: {
          map: unknown
          position: LatLng
          draggable?: boolean
        }) => {
          setPosition: (c: LatLng) => void
          getPosition: () => { lat: () => number; lng: () => number } | null
          addListener: (event: string, handler: () => void) => void
        }
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: { fields?: string[] },
          ) => {
            addListener: (event: string, handler: () => void) => void
            getPlace: () => {
              place_id?: string
              formatted_address?: string
              geometry?: { location?: { lat: () => number; lng: () => number } }
              address_components?: Array<{
                long_name: string
                short_name: string
                types: string[]
              }>
            }
          }
        }
        event: {
          clearInstanceListeners: (instance: unknown) => void
          trigger: (instance: unknown, eventName: string) => void
        }
      }
    }
    __webononeMapsPromise?: Promise<void>
  }
}

function mapsApiReady(): boolean {
  return Boolean(window.google?.maps?.Map && window.google?.maps?.places)
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (mapsApiReady()) return Promise.resolve()
  if (window.__webononeMapsPromise) return window.__webononeMapsPromise

  window.__webononeMapsPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (mapsApiReady()) {
        resolve()
        return
      }
      reject(new Error('Google Maps loaded without Places library'))
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-webonone-maps]')
    if (existing) {
      if (mapsApiReady()) {
        finish()
        return
      }
      existing.addEventListener('load', finish)
      existing.addEventListener('error', () => {
        window.__webononeMapsPromise = undefined
        reject(new Error('Failed to load Google Maps'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.webononeMaps = '1'
    script.onload = finish
    script.onerror = () => {
      window.__webononeMapsPromise = undefined
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return window.__webononeMapsPromise
}

function componentByType(
  components: Array<{ long_name: string; short_name: string; types: string[] }> | undefined,
  type: string,
  useShort = false,
): string | undefined {
  const match = components?.find((c) => c.types.includes(type))
  if (!match) return undefined
  return useShort ? match.short_name : match.long_name
}

export function CompanyMapPicker({
  mode,
  latitude,
  longitude,
  onPlaceSelected,
  fillHeight = false,
}: CompanyMapPickerProps) {
  const { t } = useTranslation('settings')
  const apiKey = getGoogleMapsApiKey()
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<{
    setCenter: (c: LatLng) => void
    setZoom: (z: number) => void
  } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ready, setReady] = useState(mapsApiReady)

  const hasPin = latitude !== null && longitude !== null

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

    const center: LatLng =
      latitude !== null && longitude !== null
        ? { lat: latitude, lng: longitude }
        : { lat: 0, lng: 0 }
    const zoom = hasPin ? 14 : 2

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapInstanceRef.current = map

    let marker: InstanceType<NonNullable<typeof window.google>['maps']['Marker']> | null = null
    if (hasPin) {
      marker = new window.google.maps.Marker({
        map,
        position: center,
        draggable: mode === 'edit',
      })
    }

    const emitFromLatLng = (lat: number, lng: number, extra?: Partial<PlaceResult>) => {
      onPlaceSelected?.({
        latitude: lat,
        longitude: lng,
        mapPlaceId: extra?.mapPlaceId ?? null,
        mapFormattedAddress: extra?.mapFormattedAddress ?? null,
        ...extra,
      })
    }

    if (mode === 'edit') {
      map.addListener('click', (e) => {
        const lat = e.latLng?.lat()
        const lng = e.latLng?.lng()
        if (lat === undefined || lng === undefined) return
        if (marker) {
          marker.setPosition({ lat, lng })
        } else {
          marker = new window.google!.maps.Marker({
            map,
            position: { lat, lng },
            draggable: true,
          })
          marker.addListener('dragend', () => {
            const pos = marker?.getPosition()
            if (!pos) return
            emitFromLatLng(pos.lat(), pos.lng())
          })
        }
        emitFromLatLng(lat, lng)
      })

      marker?.addListener('dragend', () => {
        const pos = marker?.getPosition()
        if (!pos) return
        emitFromLatLng(pos.lat(), pos.lng())
      })

      if (inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const loc = place.geometry?.location
          if (!loc) return
          const lat = loc.lat()
          const lng = loc.lng()
          map.setCenter({ lat, lng })
          map.setZoom(14)
          if (marker) {
            marker.setPosition({ lat, lng })
          } else {
            marker = new window.google!.maps.Marker({
              map,
              position: { lat, lng },
              draggable: true,
            })
          }
          const components = place.address_components
          emitFromLatLng(lat, lng, {
            mapPlaceId: place.place_id ?? null,
            mapFormattedAddress: place.formatted_address ?? null,
            addressLine1: [
              componentByType(components, 'street_number'),
              componentByType(components, 'route'),
            ]
              .filter(Boolean)
              .join(' '),
            city:
              componentByType(components, 'locality') ??
              componentByType(components, 'postal_town') ??
              componentByType(components, 'administrative_area_level_2'),
            stateRegion: componentByType(components, 'administrative_area_level_1'),
            postalCode: componentByType(components, 'postal_code'),
            country: componentByType(components, 'country'),
          })
        })
      }
    }

    // Maps paints blank when the flex container starts at 0 height — resize once laid out.
    const triggerResize = () => {
      if (!window.google?.maps?.event || !mapRef.current) return
      window.google.maps.event.trigger(map, 'resize')
      map.setCenter(center)
    }
    const raf = window.requestAnimationFrame(triggerResize)
    let lastSize = { w: 0, h: 0 }
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const w = Math.round(entry.contentRect.width)
            const h = Math.round(entry.contentRect.height)
            if (w === lastSize.w && h === lastSize.h) return
            if (w === 0 || h === 0) return
            lastSize = { w, h }
            triggerResize()
          })
        : null
    if (mapRef.current && resizeObserver) {
      resizeObserver.observe(mapRef.current)
    }

    return () => {
      window.cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      mapInstanceRef.current = null
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(map)
        if (marker) window.google.maps.event.clearInstanceListeners(marker)
      }
    }
  }, [ready, apiKey, latitude, longitude, mode, hasPin, onPlaceSelected])

  if (!apiKey) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t('companyCards.location.mapsKeyMissing')}
      </div>
    )
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>
  }

  return (
    <div className={fillHeight ? 'flex min-h-0 flex-1 flex-col gap-3' : 'space-y-3'}>
      {mode === 'edit' ? (
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('companyCards.location.searchPlaceholder')}
          aria-label={t('companyCards.location.searchAria')}
        />
      ) : null}
      <div
        ref={mapRef}
        className={
          fillHeight
            ? 'min-h-[20rem] w-full flex-1 overflow-hidden rounded-md border border-border bg-muted'
            : 'h-56 w-full overflow-hidden rounded-md border border-border bg-muted'
        }
        role="img"
        aria-label={
          hasPin
            ? t('companyCards.location.mapAriaWithPin')
            : t('companyCards.location.mapAriaNoPin')
        }
      />
      {!ready ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.location.loadingMap')}</p>
      ) : null}
      {ready && !hasPin && mode === 'view' ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.location.noPinSet')}</p>
      ) : null}
      {mode === 'edit' && !hasPin ? (
        <p className="text-sm text-muted-foreground">{t('companyCards.location.editHint')}</p>
      ) : null}
    </div>
  )
}
