import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map, mergeMap } from 'rxjs/operators'
import { sessionTokensApi } from '../services/sessionTokensApi'
import type {
  CreateSessionTokenBody,
  SessionDetail,
  SessionRun,
  SessionToken,
} from '../types/event.types'

type Status = 'idle' | 'loading' | 'saving' | 'error'

type SessionQueueSnapshot = NonNullable<SessionDetail['queue']>

interface SessionTokensState {
  eventId: string | null
  occurrenceDate: string | null
  run: SessionRun | null
  items: SessionToken[]
  queue: SessionQueueSnapshot | null
  sessionStartTime: string | null
  sessionEndTime: string | null
  sessionIssue: SessionDetail['sessionIssue']
  sessionCancelled: boolean
  effectiveStaffDisplayName: string | null
  viewerIsAssignedStaff: boolean
  listStatus: Status
  createStatus: Status
  actionStatus: Status
  listError: string | null
  createError: string | null
  actionError: string | null
  lastCreatedId: string | null
  lastAction: 'start' | 'call-next' | 'call-previous' | 'end' | null
}

const initialState: SessionTokensState = {
  eventId: null,
  occurrenceDate: null,
  run: null,
  items: [],
  queue: null,
  sessionStartTime: null,
  sessionEndTime: null,
  sessionIssue: null,
  sessionCancelled: false,
  effectiveStaffDisplayName: null,
  viewerIsAssignedStaff: false,
  listStatus: 'idle',
  createStatus: 'idle',
  actionStatus: 'idle',
  listError: null,
  createError: null,
  actionError: null,
  lastCreatedId: null,
  lastAction: null,
}

function applyDetail(state: SessionTokensState, detail: SessionDetail) {
  state.run = detail.run
  state.items = detail.items
  state.queue = detail.queue ?? null
  state.sessionStartTime = detail.sessionStartTime
  state.sessionEndTime = detail.sessionEndTime
  state.sessionIssue = detail.sessionIssue ?? null
  state.sessionCancelled = detail.sessionCancelled ?? false
  state.effectiveStaffDisplayName = detail.effectiveStaffDisplayName ?? null
  if (detail.viewerIsAssignedStaff !== undefined) {
    state.viewerIsAssignedStaff = detail.viewerIsAssignedStaff
  }
}

const sessionTokensSlice = createSlice({
  name: 'sessionTokens',
  initialState,
  reducers: {
    fetchListRequested(
      state,
      action: PayloadAction<{
        eventId: string
        occurrenceDate: string
        silent?: boolean
      }>,
    ) {
      state.eventId = action.payload.eventId
      state.occurrenceDate = action.payload.occurrenceDate
      const hasData = Boolean(state.run) || state.items.length > 0
      if (!(action.payload.silent && hasData)) {
        state.listStatus = 'loading'
      }
      state.listError = null
    },
    fetchListSucceeded(state, action: PayloadAction<SessionDetail>) {
      applyDetail(state, action.payload)
      state.listStatus = 'idle'
      state.listError = null
    },
    fetchListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    createRequested(
      state,
      _action: PayloadAction<{
        eventId: string
        occurrenceDate: string
        body: CreateSessionTokenBody
      }>,
    ) {
      state.createStatus = 'saving'
      state.createError = null
      state.lastCreatedId = null
    },
    createSucceeded(state, action: PayloadAction<SessionToken>) {
      const existing = state.items.find((item) => item.id === action.payload.id)
      if (!existing) {
        state.items = [...state.items, action.payload].sort(
          (a, b) => a.tokenNumber - b.tokenNumber,
        )
      } else {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        )
      }
      if (action.payload.status === 'serving' && state.run) {
        state.run = { ...state.run, currentTokenId: action.payload.id }
      }
      state.createStatus = 'idle'
      state.createError = null
      state.lastCreatedId = action.payload.id
    },
    createFailed(state, action: PayloadAction<string>) {
      state.createStatus = 'error'
      state.createError = action.payload
    },
    startRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.actionStatus = 'saving'
      state.actionError = null
      state.lastAction = 'start'
    },
    callNextRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.actionStatus = 'saving'
      state.actionError = null
      state.lastAction = 'call-next'
    },
    callPreviousRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.actionStatus = 'saving'
      state.actionError = null
      state.lastAction = 'call-previous'
    },
    endRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.actionStatus = 'saving'
      state.actionError = null
      state.lastAction = 'end'
    },
    actionSucceeded(state, action: PayloadAction<SessionDetail>) {
      applyDetail(state, action.payload)
      state.actionStatus = 'idle'
      state.actionError = null
    },
    actionFailed(state, action: PayloadAction<string>) {
      state.actionStatus = 'error'
      state.actionError = action.payload
    },
    resetActionStatus(state) {
      state.actionStatus = 'idle'
      state.actionError = null
      state.lastAction = null
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle'
      state.createError = null
      state.lastCreatedId = null
    },
    reset() {
      return initialState
    },
  },
})

export const sessionTokensActions = sessionTokensSlice.actions
export const sessionTokensReducer = sessionTokensSlice.reducer

const fetchListEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.fetchListRequested.type),
    mergeMap((action: ReturnType<typeof sessionTokensActions.fetchListRequested>) =>
      from(
        sessionTokensApi.getSession(action.payload.eventId, action.payload.occurrenceDate),
      ).pipe(
        map((detail) => sessionTokensActions.fetchListSucceeded(detail)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.fetchListFailed(
              err instanceof Error ? err.message : 'Failed to load tokens',
            ),
          ),
        ),
      ),
    ),
  )

const createEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.createRequested.type),
    exhaustMap((action: ReturnType<typeof sessionTokensActions.createRequested>) =>
      from(
        sessionTokensApi.create(
          action.payload.eventId,
          action.payload.occurrenceDate,
          action.payload.body,
        ),
      ).pipe(
        map((item) => sessionTokensActions.createSucceeded(item)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.createFailed(
              err instanceof Error ? err.message : 'Failed to issue token',
            ),
          ),
        ),
      ),
    ),
  )

const startEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.startRequested.type),
    exhaustMap((action: ReturnType<typeof sessionTokensActions.startRequested>) =>
      from(sessionTokensApi.start(action.payload.eventId, action.payload.occurrenceDate)).pipe(
        map((detail) => sessionTokensActions.actionSucceeded(detail)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.actionFailed(
              err instanceof Error ? err.message : 'Failed to start session',
            ),
          ),
        ),
      ),
    ),
  )

const callNextEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.callNextRequested.type),
    exhaustMap((action: ReturnType<typeof sessionTokensActions.callNextRequested>) =>
      from(
        sessionTokensApi.callNext(action.payload.eventId, action.payload.occurrenceDate),
      ).pipe(
        map((detail) => sessionTokensActions.actionSucceeded(detail)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.actionFailed(
              err instanceof Error ? err.message : 'Failed to call next token',
            ),
          ),
        ),
      ),
    ),
  )

const callPreviousEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.callPreviousRequested.type),
    exhaustMap((action: ReturnType<typeof sessionTokensActions.callPreviousRequested>) =>
      from(
        sessionTokensApi.callPrevious(action.payload.eventId, action.payload.occurrenceDate),
      ).pipe(
        map((detail) => sessionTokensActions.actionSucceeded(detail)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.actionFailed(
              err instanceof Error ? err.message : 'Failed to call previous token',
            ),
          ),
        ),
      ),
    ),
  )

const endEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionTokensActions.endRequested.type),
    exhaustMap((action: ReturnType<typeof sessionTokensActions.endRequested>) =>
      from(sessionTokensApi.end(action.payload.eventId, action.payload.occurrenceDate)).pipe(
        map((detail) => sessionTokensActions.actionSucceeded(detail)),
        catchError((err: unknown) =>
          of(
            sessionTokensActions.actionFailed(
              err instanceof Error ? err.message : 'Failed to end session',
            ),
          ),
        ),
      ),
    ),
  )

export const sessionTokensEpics = combineEpics(
  fetchListEpic,
  createEpic,
  startEpic,
  callNextEpic,
  callPreviousEpic,
  endEpic,
)

export function nextTokenLabel(items: SessionToken[]): string {
  const max = items.reduce((acc, item) => Math.max(acc, item.tokenNumber), 0)
  return String(max + 1).padStart(3, '0')
}
