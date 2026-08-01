import { useCallback, useEffect, useRef, useState } from 'react'

export type UserLocationCoords = {
  lat: number
  lng: number
}

export type UserLocationStatus = 'idle' | 'pending' | 'ready' | 'denied' | 'unavailable'

export type UserLocationSource = 'gps' | 'ip'

export type UserLocationState = {
  coords: UserLocationCoords | null
  /** Human-readable place from reverse geocode when available. */
  placeLabel: string | null
  status: UserLocationStatus
  /** How coords were obtained when ready. */
  source: UserLocationSource | null
  /** True when the browser blocked precise location (IP fallback may still work). */
  permissionDenied: boolean
  /**
   * Show the in-app allow dialog so a user click can open the browser
   * location permission popup.
   */
  showPermissionPrompt: boolean
  /** Request (or re-request) browser geolocation — call from a button click. */
  requestLocation: () => void
  /** Open the in-app Allow location access? dialog (any time). */
  openPermissionPrompt: () => void
  /** User chose not to allow precise location from our dialog. */
  dismissPermissionPrompt: () => void
  /** Resolve with coords once ready, or null if denied/unavailable/timeout. */
  waitForCoords: (timeoutMs?: number) => Promise<UserLocationCoords | null>
}

const DISMISS_KEY = 'website.locationPromptDismissed'

async function reverseGeocodeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${encodeURIComponent(String(lat))}` +
      `&longitude=${encodeURIComponent(String(lng))}` +
      `&localityLanguage=en`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      locality?: string
      city?: string
      principalSubdivision?: string
      countryName?: string
    }
    const parts = [data.locality || data.city, data.principalSubdivision, data.countryName].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    )
    return parts.length > 0 ? parts.join(', ') : null
  } catch {
    return null
  }
}

async function fetchIpLocation(): Promise<{
  coords: UserLocationCoords
  placeLabel: string | null
} | null> {
  try {
    const res = await fetch(
      'https://api.bigdatacloud.net/data/ip-geolocation-client?localityLanguage=en',
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      latitude?: number
      longitude?: number
      city?: string
      locality?: string
      principalSubdivision?: string
      countryName?: string
    }
    if (
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number' ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude)
    ) {
      return null
    }
    const coords = { lat: data.latitude, lng: data.longitude }
    const parts = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    )
    return {
      coords,
      placeLabel: parts.length > 0 ? parts.join(', ') : formatCoords(coords),
    }
  } catch {
    return null
  }
}

function formatCoords(coords: UserLocationCoords): string {
  const latHemisphere = coords.lat >= 0 ? 'N' : 'S'
  const lngHemisphere = coords.lng >= 0 ? 'E' : 'W'
  return `${Math.abs(coords.lat).toFixed(4)}° ${latHemisphere}, ${Math.abs(coords.lng).toFixed(4)}° ${lngHemisphere}`
}

function settleWaiters(
  waitersRef: { current: Array<(value: UserLocationCoords | null) => void> },
  value: UserLocationCoords | null,
) {
  const waiters = waitersRef.current
  waitersRef.current = []
  for (const resolve of waiters) resolve(value)
}

async function queryGeolocationPermission(): Promise<PermissionState | 'unsupported'> {
  try {
    if (!navigator.permissions?.query) return 'unsupported'
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'unsupported'
  }
}

/**
 * Prefer precise browser geolocation (triggered by a user click so the browser
 * shows its Allow popup). Fall back to IP-based approximate location otherwise.
 */
export function useUserLocation(): UserLocationState {
  const [coords, setCoords] = useState<UserLocationCoords | null>(null)
  const [placeLabel, setPlaceLabel] = useState<string | null>(null)
  const [status, setStatus] = useState<UserLocationStatus>('idle')
  const [source, setSource] = useState<UserLocationSource | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const coordsRef = useRef<UserLocationCoords | null>(null)
  const statusRef = useRef<UserLocationStatus>('idle')
  const waitersRef = useRef<Array<(value: UserLocationCoords | null) => void>>([])
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    coordsRef.current = coords
  }, [coords])

  useEffect(() => {
    statusRef.current = status
    if (status === 'ready') {
      settleWaiters(waitersRef, coordsRef.current)
    } else if (status === 'denied' || status === 'unavailable') {
      settleWaiters(waitersRef, null)
    }
  }, [status])

  const applyIpFallback = useCallback(async (wasDenied: boolean, keepPromptOpen = false) => {
    setPermissionDenied(wasDenied)
    if (!keepPromptOpen) {
      setShowPermissionPrompt(false)
    }
    const ip = await fetchIpLocation()
    if (ip) {
      setCoords(ip.coords)
      setPlaceLabel(ip.placeLabel)
      setSource('ip')
      setStatus('ready')
      return
    }
    setCoords(null)
    setPlaceLabel(null)
    setSource(null)
    setStatus(wasDenied ? 'denied' : 'unavailable')
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      void applyIpFallback(false)
      return
    }

    // Start geolocation FIRST, while still in the user-gesture call stack.
    // Closing the dialog / setState before this cancels the browser permission popup.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCoords(next)
        setSource('gps')
        setPermissionDenied(false)
        setStatus('ready')
        setShowPermissionPrompt(false)
        try {
          sessionStorage.removeItem(DISMISS_KEY)
        } catch {
          /* ignore */
        }
        void reverseGeocodeLabel(next.lat, next.lng).then((label) => {
          setPlaceLabel(label ?? formatCoords(next))
        })
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED
        void applyIpFallback(denied)
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      },
    )

    setStatus('pending')
    // Delay closing the dialog so Chrome can show its permission UI first.
    window.setTimeout(() => {
      setShowPermissionPrompt(false)
    }, 250)
  }, [applyIpFallback])

  const openPermissionPrompt = useCallback(() => {
    try {
      sessionStorage.removeItem(DISMISS_KEY)
    } catch {
      /* ignore */
    }
    setShowPermissionPrompt(true)
  }, [])

  const dismissPermissionPrompt = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setShowPermissionPrompt(false)
    // Keep an existing approximate location; only fall back when we have none yet.
    if (statusRef.current === 'ready' && coordsRef.current) {
      return
    }
    void applyIpFallback(permissionDenied)
  }, [applyIpFallback, permissionDenied])

  const waitForCoords = useCallback((timeoutMs = 12_000) => {
    if (statusRef.current === 'ready' && coordsRef.current) {
      return Promise.resolve(coordsRef.current)
    }
    if (statusRef.current === 'denied' || statusRef.current === 'unavailable') {
      return Promise.resolve(null)
    }

    return new Promise<UserLocationCoords | null>((resolve) => {
      const timer = window.setTimeout(() => {
        const index = waitersRef.current.indexOf(onSettle)
        if (index >= 0) waitersRef.current.splice(index, 1)
        resolve(coordsRef.current)
      }, timeoutMs)

      function onSettle(value: UserLocationCoords | null) {
        window.clearTimeout(timer)
        resolve(value)
      }

      waitersRef.current.push(onSettle)
    })
  }, [])

  useEffect(() => {
    if (bootstrappedRef.current) return
    bootstrappedRef.current = true

    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      dismissed = false
    }

    void (async () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        await applyIpFallback(false)
        return
      }

      const permission = await queryGeolocationPermission()

      if (permission === 'granted') {
        // Already allowed — request without our dialog (no new browser popup).
        requestLocation()
        return
      }

      if (permission === 'denied') {
        await applyIpFallback(true, true)
        // Still offer the in-app dialog so the user can follow steps and retry.
        if (!dismissed) {
          setShowPermissionPrompt(true)
        }
        return
      }

      // 'prompt' or unsupported: show our dialog so a click opens the browser popup.
      if (dismissed) {
        await applyIpFallback(false)
        return
      }

      setStatus('idle')
      setShowPermissionPrompt(true)
    })()
  }, [applyIpFallback, requestLocation])

  return {
    coords,
    placeLabel,
    status,
    source,
    permissionDenied,
    showPermissionPrompt,
    requestLocation,
    openPermissionPrompt,
    dismissPermissionPrompt,
    waitForCoords,
  }
}

export function formatUserCoords(coords: UserLocationCoords): string {
  return formatCoords(coords)
}
