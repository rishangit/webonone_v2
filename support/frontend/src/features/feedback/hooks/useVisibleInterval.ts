import { useEffect, useRef } from 'react'

/** Runs `callback` every `intervalMs` while the document is visible. */
export function useVisibleInterval(
  callback: () => void,
  intervalMs: number,
  enabled: boolean,
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let timerId: number | undefined

    function clearTimer() {
      if (timerId !== undefined) {
        window.clearInterval(timerId)
        timerId = undefined
      }
    }

    function tick() {
      if (document.visibilityState === 'visible') {
        callbackRef.current()
      }
    }

    function startTimer() {
      clearTimer()
      if (document.visibilityState === 'visible') {
        timerId = window.setInterval(tick, intervalMs)
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        tick()
        startTimer()
      } else {
        clearTimer()
      }
    }

    startTimer()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, intervalMs])
}
