import { useCallback, useRef } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

const BOTTOM_THRESHOLD_PX = 160

export interface UseScrollLoadMoreOptions {
  enabled?: boolean
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

/** Attach the returned handler to `FeatureScreen` `onScroll` for on-scroll pagination. */
export function useScrollLoadMore({
  enabled = true,
  hasMore,
  loadingMore,
  onLoadMore,
}: UseScrollLoadMoreOptions) {
  const loadingRef = useRef(loadingMore)
  loadingRef.current = loadingMore

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!enabled || !hasMore || loadingRef.current) return
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - BOTTOM_THRESHOLD_PX
      ) {
        onLoadMore()
      }
    },
    [enabled, hasMore, onLoadMore],
  )
}
