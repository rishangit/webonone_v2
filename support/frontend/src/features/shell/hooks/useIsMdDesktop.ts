import { useEffect, useState } from 'react'

const MD_DESKTOP_QUERY = '(min-width: 768px)'

export function useIsMdDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MD_DESKTOP_QUERY).matches : true,
  )

  useEffect(() => {
    const media = window.matchMedia(MD_DESKTOP_QUERY)
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}
