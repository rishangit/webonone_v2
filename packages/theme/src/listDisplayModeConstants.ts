export type ListDisplayMode = 'list' | 'grid' | 'card'

export const DEFAULT_LIST_DISPLAY_MODE: ListDisplayMode = 'list'

export const LIST_DISPLAY_MODE_QUERY = 'list_display_mode'

export const LIST_DISPLAY_MODE_MESSAGE_TYPES = {
  APPLY: 'webonone:list-display-mode:apply',
} as const

export const LIST_DISPLAY_MODE_CHANGE_EVENT = 'webonone:list-display-mode-change'
