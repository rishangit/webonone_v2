import {
  Children,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { CONTROL_ANIMATION_MS, controlEaseOut } from '../lib/controlAnimation'
import { cn } from '../lib/cn'
import { CONTROL_HEIGHT_SM_CLASS, CONTROL_HEIGHT_SM_PX } from '../lib/controlStyles'
import {
  ListPageActionsContext,
  SEARCH_CLOSE_MS,
  SEARCH_OVERLAY_START_GAP,
  subscribeListPageOutsidePress,
  type SearchOverlayConfig,
} from '../layouts/pageHeaderSearchContext'
import { SearchInputField } from './SearchInput'

const SEARCH_ICON_SIZE = CONTROL_HEIGHT_SM_PX
const TOOLBAR_GAP = SEARCH_OVERLAY_START_GAP

function ListPageActionsInHeader({ children }: { children: ReactNode }) {
  return (
    <View
      className={cn(
        'w-full flex-row flex-nowrap items-center justify-end gap-2',
        CONTROL_HEIGHT_SM_CLASS,
      )}
    >
      {children}
    </View>
  )
}

/**
 * Standalone toolbar — same geometry as web `ListPageActions` / `PageHeader` on
 * viewports below `sm`: overlay grows left over the search icon; filter + add stay put.
 */
function ListPageActionsStandalone({ children }: { children: ReactNode }) {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchRevealed, setSearchRevealed] = useState(false)
  const [addExpanded, setAddExpanded] = useState(false)
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayConfig | null>(null)
  const insidePressRef = useRef(false)
  const overlayRef = useRef<SearchOverlayConfig | null>(null)
  const rowWidth = useSharedValue(0)
  const searchWidth = useSharedValue(SEARCH_ICON_SIZE)
  const trailingWidth = useSharedValue(0)
  const expandedProgress = useSharedValue(0)

  const childArray = Children.toArray(children)
  const searchChild = childArray[0]
  const trailingChildren = childArray.slice(1)

  overlayRef.current = searchOverlay

  const closeSearch = useCallback(() => {
    setSearchExpanded(false)
    overlayRef.current?.inputRef?.current?.blur()
  }, [])

  const collapseAdd = useCallback(() => {
    setAddExpanded(false)
  }, [])

  const openSearch = useCallback(() => {
    setAddExpanded(false)
    setSearchRevealed(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSearchExpanded(true))
    })
  }, [])

  const expandAdd = useCallback(() => {
    setSearchExpanded(false)
    overlayRef.current?.inputRef?.current?.blur()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAddExpanded(true))
    })
  }, [])

  useEffect(() => {
    expandedProgress.value = withTiming(searchExpanded ? 1 : 0, {
      duration: CONTROL_ANIMATION_MS,
      easing: controlEaseOut,
    })
  }, [expandedProgress, searchExpanded])

  useEffect(() => {
    if (searchExpanded || !searchRevealed) return
    const timeoutId = setTimeout(() => setSearchRevealed(false), SEARCH_CLOSE_MS)
    return () => clearTimeout(timeoutId)
  }, [searchExpanded, searchRevealed])

  useEffect(() => {
    if (!searchRevealed && !addExpanded) return
    return subscribeListPageOutsidePress(() => {
      setTimeout(() => {
        if (insidePressRef.current) return
        collapseAdd()
        closeSearch()
      }, 0)
    })
  }, [searchRevealed, addExpanded, closeSearch, collapseAdd])

  const overlayStyle = useAnimatedStyle(() => {
    const icon = Math.max(searchWidth.value, 1)
    const rest = trailingWidth.value
    const gap = rest > 0 ? TOOLBAR_GAP : 0
    const expandedWidth = Math.max(icon, rowWidth.value - rest - gap)
    const width = icon + (expandedWidth - icon) * expandedProgress.value
    return {
      width,
      right: rest + gap,
    }
  })

  function handleRowLayout(event: LayoutChangeEvent) {
    rowWidth.value = event.nativeEvent.layout.width
  }

  function handleSearchLayout(event: LayoutChangeEvent) {
    searchWidth.value = event.nativeEvent.layout.width
  }

  function handleTrailingLayout(event: LayoutChangeEvent) {
    trailingWidth.value = event.nativeEvent.layout.width
  }

  function markInsidePress(event: GestureResponderEvent) {
    event.stopPropagation()
    insidePressRef.current = true
    requestAnimationFrame(() => {
      insidePressRef.current = false
    })
  }

  const value = useMemo(
    () => ({
      searchExpanded,
      searchRevealed,
      openSearch,
      closeSearch,
      setSearchOverlay,
      addExpanded,
      expandAdd,
      collapseAdd,
    }),
    [
      searchExpanded,
      searchRevealed,
      openSearch,
      closeSearch,
      addExpanded,
      expandAdd,
      collapseAdd,
    ],
  )

  return (
    <ListPageActionsContext.Provider value={value}>
      <View
        className={cn('relative w-full', CONTROL_HEIGHT_SM_CLASS)}
        onLayout={handleRowLayout}
        onTouchStart={markInsidePress}
      >
        <View
          className={cn(
            'w-full flex-row flex-nowrap items-center justify-end gap-2',
            CONTROL_HEIGHT_SM_CLASS,
          )}
        >
          {searchChild ? (
            <View className="shrink-0" onLayout={handleSearchLayout} collapsable={false}>
              {searchChild}
            </View>
          ) : null}
          {trailingChildren.length > 0 ? (
            <View
              className="flex-row flex-nowrap items-center gap-2"
              onLayout={handleTrailingLayout}
              collapsable={false}
            >
              {trailingChildren}
            </View>
          ) : null}
        </View>
        <Animated.View
          className={cn('absolute bottom-0 top-0 overflow-hidden', CONTROL_HEIGHT_SM_CLASS)}
          style={[overlayStyle, { opacity: searchRevealed ? 1 : 0, zIndex: 15 }]}
          pointerEvents={searchRevealed ? 'auto' : 'none'}
          collapsable={false}
        >
          {searchOverlay ? (
            <SearchInputField
              compact
              expanded={searchExpanded}
              className="w-full"
              {...searchOverlay}
            />
          ) : null}
        </Animated.View>
      </View>
    </ListPageActionsContext.Provider>
  )
}

/** Toolbar row for list pages (search + filter + add) with compact expand, matching web below `sm`. */
export function ListPageActions({ children }: { children: ReactNode }) {
  const parentSearch = useContext(ListPageActionsContext)

  if (parentSearch !== null) {
    return <ListPageActionsInHeader>{children}</ListPageActionsInHeader>
  }

  return <ListPageActionsStandalone>{children}</ListPageActionsStandalone>
}
