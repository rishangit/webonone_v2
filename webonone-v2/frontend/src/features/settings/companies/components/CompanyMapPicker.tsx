import { useEffect, useRef, useState } from 'react'
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
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: { center: LatLng; zoom: number; mapTypeControl?: boolean; streetViewControl?: boolean },
        ) => {
          setCenter: (c: LatLng) => void
          addListener: (event: string, handler: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => void
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
        event: { clearInstanceListeners: (instance: unknown) => void }
      }
    }
    __webononeMapsPromise?: Promise<void>
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve()
  if (window.__webononeMapsPromise) return window.__webononeMapsPromise

  window.__webononeMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-webonone-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.webononeMaps = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
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
}: CompanyMapPickerProps) {
  const apiKey = getGoogleMapsApiKey()
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

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
    })

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

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(map)
        if (marker) window.google.maps.event.clearInstanceListeners(marker)
      }
    }
  }, [ready, apiKey, latitude, longitude, mode, hasPin, onPlaceSelected])

  if (!apiKey) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Set location on the map is unavailable until <code>VITE_GOOGLE_MAPS_API_KEY</code> is
        configured. You can still save address details below.
      </div>
    )
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>
  }

  return (
    <div className="space-y-3">
      {mode === 'edit' ? (
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a place…"
          aria-label="Search map location"
        />
      ) : null}
      <div
        ref={mapRef}
        className="h-56 w-full overflow-hidden rounded-md border border-border bg-muted"
        role="img"
        aria-label={hasPin ? 'Company map location' : 'Map — no pin set'}
      />
      {!hasPin && mode === 'view' ? (
        <p className="text-sm text-muted-foreground">No map location set yet.</p>
      ) : null}
      {mode === 'edit' && !hasPin ? (
        <p className="text-sm text-muted-foreground">
          Search for a place or click the map to set a pin.
        </p>
      ) : null}
    </div>
  )
}
