import { createContext, useContext, type RefObject } from 'react'
import type { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData, TextInputProps } from 'react-native'

export type SearchOverlayConfig = {
  inputRef?: RefObject<TextInput | null>
  value?: string
  onClear?: () => void
  onChangeText?: (text: string) => void
  placeholder?: string
  editable?: boolean
  accessibilityLabel?: string
  onSubmitEditing?: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void
  onBlur?: TextInputProps['onBlur']
}

export interface ListPageActionsController {
  searchExpanded: boolean
  searchRevealed: boolean
  openSearch: () => void
  closeSearch: () => void
  setSearchOverlay: (config: SearchOverlayConfig | null) => void
  addExpanded: boolean
  expandAdd: () => void
  collapseAdd: () => void
}

export const ListPageActionsContext = createContext<ListPageActionsController | null>(null)

export function useListPageActions() {
  return useContext(ListPageActionsContext)
}

const outsidePressHandlers = new Set<() => void>()

/** Close compact search / add when a press happens outside the toolbar (web `pointerdown`). */
export function subscribeListPageOutsidePress(handler: () => void) {
  outsidePressHandlers.add(handler)
  return () => {
    outsidePressHandlers.delete(handler)
  }
}

export function emitListPageOutsidePress() {
  outsidePressHandlers.forEach((handler) => handler())
}

/** Toolbar `gap-2` between expanded search and filter/add (8px). */
export const SEARCH_OVERLAY_START_GAP = 8
export const SEARCH_CLOSE_MS = 300
