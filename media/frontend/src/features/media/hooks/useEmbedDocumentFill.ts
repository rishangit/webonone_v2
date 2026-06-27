import { useEffect } from 'react'

/** Ensures html/body/#root fill the iframe so flex-1 crop/layout children get height. */
export function useEmbedDocumentFill(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    html.classList.add('h-full')
    body.classList.add('h-full', 'overflow-hidden')
    root?.classList.add('flex', 'h-full', 'min-h-0', 'flex-col')

    return () => {
      html.classList.remove('h-full')
      body.classList.remove('h-full', 'overflow-hidden')
      root?.classList.remove('flex', 'h-full', 'min-h-0', 'flex-col')
    }
  }, [enabled])
}
