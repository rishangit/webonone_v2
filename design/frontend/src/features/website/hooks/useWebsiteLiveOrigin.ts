import { useEffect, useState } from 'react'
import { fetchWebsiteLiveUrl } from '../api'

export function useWebsiteLiveOrigin(enabled: boolean) {
  const [liveOrigin, setLiveOrigin] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void fetchWebsiteLiveUrl()
      .then((data) => {
        if (!cancelled && data.webUrl) setLiveOrigin(data.webUrl)
      })
      .catch(() => {
        if (!cancelled) setLiveOrigin(null)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return liveOrigin
}
