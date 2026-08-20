import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import type { NotificationItem } from '../services/notificationsApi'

export type NotificationsListRequest = {
  limit?: number
  before?: string
  mode: 'replace' | 'append'
}

export interface NotificationsState {
  items: NotificationItem[]
  unreadCount: number
  status: 'idle' | 'loading' | 'error'
  pollStatus: 'idle' | 'loading' | 'error'
  error: string | null
  lastPolledAt: number | null
  hasMore: boolean
  /** One-shot toast payload after unread increases; cleared by UI. */
  pendingToastTitle: string | null
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  status: 'idle',
  pollStatus: 'idle',
  error: null,
  lastPolledAt: null,
  hasMore: false,
  pendingToastTitle: null,
}

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pollUnreadRequested(state) {
      state.pollStatus = 'loading'
    },
    pollUnreadSucceeded(
      state,
      action: PayloadAction<{ count: number; previousCount: number; latestTitle: string | null }>,
    ) {
      const { count, previousCount, latestTitle } = action.payload
      if (count > previousCount && latestTitle) {
        state.pendingToastTitle = latestTitle
      }
      state.unreadCount = count
      state.pollStatus = 'idle'
      state.lastPolledAt = Date.now()
      state.error = null
    },
    pollUnreadFailed(state, action: PayloadAction<string>) {
      state.pollStatus = 'error'
      state.error = action.payload
    },
    clearPendingToast(state) {
      state.pendingToastTitle = null
    },
    listRequested(state, _action: PayloadAction<NotificationsListRequest>) {
      state.status = 'loading'
      state.error = null
    },
    listSucceeded(
      state,
      action: PayloadAction<{
        items: NotificationItem[]
        mode: 'replace' | 'append'
        hasMore: boolean
      }>,
    ) {
      const { items, mode, hasMore } = action.payload
      state.items = mode === 'append' ? [...state.items, ...items] : items
      state.hasMore = hasMore
      state.status = 'idle'
      state.error = null
    },
    listFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    markReadRequested(_state, _action: PayloadAction<string>) {},
    markReadSucceeded(state, action: PayloadAction<NotificationItem>) {
      const idx = state.items.findIndex((item) => item.id === action.payload.id)
      if (idx >= 0) state.items[idx] = action.payload
      if (action.payload.readAt && state.unreadCount > 0) {
        state.unreadCount -= 1
      }
    },
    markAllReadRequested() {},
    markAllReadSucceeded(state) {
      state.items = state.items.map((item) =>
        item.readAt ? item : { ...item, readAt: new Date().toISOString() },
      )
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.loginSuccess, () => initialState)
    builder.addCase(authActions.logout, () => initialState)
  },
})

export const notificationsReducer = notificationsSlice.reducer
export const notificationsActions = notificationsSlice.actions
