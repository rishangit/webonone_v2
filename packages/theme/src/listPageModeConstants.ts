export type ListPageMode = 'pagination' | 'on-scroll'

export const DEFAULT_LIST_PAGE_MODE: ListPageMode = 'pagination'

export const LIST_PAGE_MODE_QUERY = 'list_page_mode'

export const LIST_PAGE_MODE_MESSAGE_TYPES = {
  APPLY: 'webonone:list-page-mode:apply',
} as const

export const LIST_PAGE_MODE_CHANGE_EVENT = 'webonone:list-page-mode-change'
