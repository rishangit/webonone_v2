import { useCallback, useEffect, useRef, useState } from 'react'

/** Brief overlay guard after an inner dialog closes — blocks pointer fall-through to outer dialogs. */
export function useNestedDialogDismissBuffer() {
  const [blockDismiss, setBlockDismiss] = useState(false)
  const blockDismissRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const armDismissBuffer = useCallback(() => {
    blockDismissRef.current = true
    setBlockDismiss(true)
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      blockDismissRef.current = false
      setBlockDismiss(false)
      timerRef.current = null
    }, 150)
  }, [])

  const isDismissBlocked = useCallback(
    () => blockDismissRef.current || blockDismiss,
    [blockDismiss],
  )

  return { blockDismiss, armDismissBuffer, isDismissBlocked }
}
