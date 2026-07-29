import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map, mergeMap } from 'rxjs/operators'
import { sessionTokensApi } from '../services/sessionTokensApi'
import type { CreateSessionTokenBody, SessionToken } from '../types/event.types'

type Status = 'idle' | 'loading' | 'saving' | 'error'

interface SessionTokensState {
  eventId: string | null
  occurrenceDate: string | null
  items: SessionToken[]
  listStatus: Status
  createStatus: Status
  listError: string | null
  createError: string | null
  lastCreatedId: string | null
}

const initialState: SessionTokensState = {
  eventId: null,
  occurrenceDate: null,
  items: [],
  listStatus: 'idle',
  createStatus: 'idle',
  listError: null,
  createError: null,
  lastCreatedId: null,
}

const sessionTokensSlice = createSlice({
  name: 'sessionTokens',
  initialState,
  reducers: {
    fetchListRequested(
      state,
      action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.eventId = action.payload.eventId
      state.occurrenceDate = action.payload.occurrenceDate
      state.listStatus = 'loading'
      state.listError = null
    },
    fetchListSucceeded(state, action: PayloadAction<SessionToken[]>) {
      state.items = action.payload
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
      }
      state.createStatus = 'idle'
      state.createError = null
      state.lastCreatedId = action.payload.id
    },
    createFailed(state, action: PayloadAction<string>) {
      state.createStatus = 'error'
      state.createError = action.payload
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
        sessionTokensApi.list(action.payload.eventId, action.payload.occurrenceDate),
      ).pipe(
        map((items) => sessionTokensActions.fetchListSucceeded(items)),
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

export const sessionTokensEpics = combineEpics(fetchListEpic, createEpic)

export function nextTokenLabel(items: SessionToken[]): string {
  const max = items.reduce((acc, item) => Math.max(acc, item.tokenNumber), 0)
  return String(max + 1).padStart(3, '0')
}
