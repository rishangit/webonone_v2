import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FeedbackComment, FeedbackReport } from '@/features/feedback/services/feedbackApi'
import type { FeedbackStatus, FeedbackType } from '@/features/feedback/schemas/feedbackSchemas'
import type {
  CreateFeedbackFormValues,
  FeedbackCommentFormValues,
  UpdateFeedbackFormValues,
} from '@/features/feedback/schemas/feedbackSchemas'

export type FeedbackListStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface FeedbackListQuery {
  page: number
  pageSize: number
  type?: FeedbackType
  status?: FeedbackStatus
  q?: string
  append?: boolean
}

interface FeedbackState {
  items: FeedbackReport[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  listStatus: FeedbackListStatus
  listError: string | null
  loadingMore: boolean
  createStatus: FeedbackListStatus
  createError: string | null
  updatingId: string | null
  updateError: string | null
  editStatus: FeedbackListStatus
  editError: string | null
  editingId: string | null
  commentsByReportId: Record<string, FeedbackComment[]>
  commentsStatus: FeedbackListStatus
  commentsError: string | null
  commentsReportId: string | null
  commentCreateStatus: FeedbackListStatus
  commentCreateError: string | null
}

const initialState: FeedbackState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  hasMore: false,
  listStatus: 'idle',
  listError: null,
  loadingMore: false,
  createStatus: 'idle',
  createError: null,
  updatingId: null,
  updateError: null,
  editStatus: 'idle',
  editError: null,
  editingId: null,
  commentsByReportId: {},
  commentsStatus: 'idle',
  commentsError: null,
  commentsReportId: null,
  commentCreateStatus: 'idle',
  commentCreateError: null,
}

export const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    loadListRequested(state, action: PayloadAction<FeedbackListQuery>) {
      state.listError = null
      if (action.payload.append) {
        state.loadingMore = true
      } else {
        state.listStatus = 'loading'
      }
    },
    loadListSucceeded(
      state,
      action: PayloadAction<{
        items: FeedbackReport[]
        total: number
        page: number
        pageSize: number
        hasMore: boolean
        append?: boolean
      }>,
    ) {
      state.listStatus = 'succeeded'
      state.loadingMore = false
      state.total = action.payload.total
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
      state.hasMore = action.payload.hasMore
      state.items = action.payload.append
        ? [...state.items, ...action.payload.items]
        : action.payload.items
    },
    loadListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'failed'
      state.loadingMore = false
      state.listError = action.payload
    },
    createRequested(state, _action: PayloadAction<CreateFeedbackFormValues>) {
      state.createStatus = 'loading'
      state.createError = null
    },
    createSucceeded(state, action: PayloadAction<FeedbackReport>) {
      state.createStatus = 'succeeded'
      state.items = [action.payload, ...state.items]
      state.total += 1
    },
    createFailed(state, action: PayloadAction<string>) {
      state.createStatus = 'failed'
      state.createError = action.payload
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle'
      state.createError = null
    },
    updateStatusRequested(
      state,
      action: PayloadAction<{ id: string; status: FeedbackStatus }>,
    ) {
      state.updatingId = action.payload.id
      state.updateError = null
    },
    updateStatusSucceeded(state, action: PayloadAction<FeedbackReport>) {
      state.updatingId = null
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      )
    },
    updateStatusFailed(state, action: PayloadAction<string>) {
      state.updatingId = null
      state.updateError = action.payload
    },
    updateRequested(
      state,
      action: PayloadAction<{ id: string; values: UpdateFeedbackFormValues }>,
    ) {
      state.editStatus = 'loading'
      state.editError = null
      state.editingId = action.payload.id
    },
    updateSucceeded(state, action: PayloadAction<FeedbackReport>) {
      state.editStatus = 'succeeded'
      state.editingId = null
      state.items = state.items.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      )
    },
    updateFailed(state, action: PayloadAction<string>) {
      state.editStatus = 'failed'
      state.editingId = null
      state.editError = action.payload
    },
    resetEditStatus(state) {
      state.editStatus = 'idle'
      state.editError = null
      state.editingId = null
    },
    loadCommentsRequested(state, action: PayloadAction<string>) {
      state.commentsStatus = 'loading'
      state.commentsError = null
      state.commentsReportId = action.payload
    },
    loadCommentsSucceeded(
      state,
      action: PayloadAction<{ reportId: string; items: FeedbackComment[] }>,
    ) {
      state.commentsStatus = 'succeeded'
      state.commentsByReportId[action.payload.reportId] = action.payload.items
    },
    loadCommentsFailed(state, action: PayloadAction<string>) {
      state.commentsStatus = 'failed'
      state.commentsError = action.payload
    },
    commentCreateRequested(
      state,
      _action: PayloadAction<{ reportId: string; body: FeedbackCommentFormValues }>,
    ) {
      state.commentCreateStatus = 'loading'
      state.commentCreateError = null
    },
    commentCreateSucceeded(
      state,
      action: PayloadAction<{ reportId: string; comment: FeedbackComment }>,
    ) {
      state.commentCreateStatus = 'succeeded'
      const existing = state.commentsByReportId[action.payload.reportId] ?? []
      state.commentsByReportId[action.payload.reportId] = [
        ...existing,
        action.payload.comment,
      ]
    },
    commentCreateFailed(state, action: PayloadAction<string>) {
      state.commentCreateStatus = 'failed'
      state.commentCreateError = action.payload
    },
    resetCommentCreateStatus(state) {
      state.commentCreateStatus = 'idle'
      state.commentCreateError = null
    },
    clearUnreadForReport(state, action: PayloadAction<string>) {
      state.items = state.items.map((item) =>
        item.id === action.payload ? { ...item, unreadCommentCount: 0 } : item,
      )
    },
  },
})

export const feedbackReducer = feedbackSlice.reducer
export const feedbackActions = feedbackSlice.actions

export type { FeedbackListQuery }
