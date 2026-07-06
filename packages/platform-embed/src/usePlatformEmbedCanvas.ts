import { useEffect } from 'react'

import { persistPlatformEmbedSessionFromUrl } from './embedSession'

import { PLATFORM_EMBED_QUERY } from './types'



export const PLATFORM_EMBED_CANVAS_CLASS = 'platform-embed-canvas'

export const PLATFORM_EMBED_APP_HOST_CLASS = 'platform-embed-app-host'

export const PLATFORM_EMBED_ROOT_CLASS = 'platform-embed-root'



export function shouldUsePlatformEmbedCanvas(): boolean {

  if (typeof window === 'undefined') {

    return false

  }



  if (window.self !== window.top) {

    return true

  }



  const params = new URLSearchParams(window.location.search)

  return (

    params.get(PLATFORM_EMBED_QUERY.EMBED) === PLATFORM_EMBED_QUERY.EMBED_VALUE &&

    Boolean(params.get(PLATFORM_EMBED_QUERY.PARENT_ORIGIN))

  )

}



function applyPlatformEmbedCanvasDom(): void {

  const { documentElement: html, body } = document



  html.classList.add(PLATFORM_EMBED_CANVAS_CLASS)

  html.style.height = '100%'

  html.style.overflow = 'hidden'



  body.style.height = '100%'

  body.style.minHeight = '0'

  body.style.margin = '0'

  body.style.overflow = 'hidden'

  body.style.display = 'flex'

  body.style.flexDirection = 'column'



  const root = document.getElementById('root')

  if (root) {

    root.classList.add(PLATFORM_EMBED_ROOT_CLASS)

    Object.assign(root.style, {

      position: 'fixed',

      top: '0',

      right: '0',

      bottom: '0',

      left: '0',

      display: 'flex',

      flexDirection: 'column',

      width: '100%',

      minHeight: '0',

      overflow: 'hidden',

    })

  }

}



/** Apply embed canvas class and full-height #root before first paint. */

export function ensurePlatformEmbedCanvas(): void {

  if (typeof document === 'undefined' || !shouldUsePlatformEmbedCanvas()) {

    return

  }



  persistPlatformEmbedSessionFromUrl()

  applyPlatformEmbedCanvasDom()

}



/** Transparent html/body so the parent shell theme canvas shows through the iframe. */

export function usePlatformEmbedCanvas(): void {

  useEffect(() => {

    if (!shouldUsePlatformEmbedCanvas()) {

      return

    }

    applyPlatformEmbedCanvasDom()

  }, [])

}


