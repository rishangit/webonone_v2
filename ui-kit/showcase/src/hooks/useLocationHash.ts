import { useCallback, useEffect, useState } from 'react'

/**
 * Current `window.location.hash` (including `#`).
 * Updates React state synchronously on navigate so controlled tabs don't snap back.
 */
export function useLocationHash(): [string, (next: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    function sync() {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const navigate = useCallback((next: string) => {
    const normalized = next.replace(/^#/, '').trim()
    const withHash = normalized ? `#${normalized}` : ''
    setHash(withHash)
    if (window.location.hash !== withHash) {
      window.location.hash = normalized
    }
  }, [])

  return [hash, navigate]
}
