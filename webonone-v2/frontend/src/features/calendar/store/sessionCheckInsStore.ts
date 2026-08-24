import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { sessionTokensApi } from '../services/sessionTokensApi'
import type { SessionCheckIn, SessionCheckInsResult } from '../types/event.types'

type Status = 'idle' | 'loading' | 'saving' | 'error'

interface SessionCheckInsState {
  items: SessionCheckIn[]
  canCheckIn: boolean
  checkedIn: boolean
  listStatus: Status
  actionStatus: Status
  listError: string | null
  actionError: string | null
}

const initialState: SessionCheckInsState = {
  items: [],
  canCheckIn: false,
  checkedIn: false,
  listStatus: 'idle',
  actionStatus: 'idle',
  listError: null,
  actionError: null,
}

function applyResult(state: SessionCheckInsState, result: SessionCheckInsResult) {
  state.items = result.items
  state.canCheckIn = result.canCheckIn
  state.checkedIn = result.checkedIn
}

const sessionCheckInsSlice = createSlice({
  name: 'sessionCheckIns',
  initialState,
  reducers: {
    fetchListRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.listStatus = 'loading'
      state.listError = null
    },
    fetchListSucceeded(state, action: PayloadAction<SessionCheckInsResult>) {
      applyResult(state, action.payload)
      state.listStatus = 'idle'
    },
    fetchListFailed(state, action: PayloadAction<string>) {
      state.listStatus = 'error'
      state.listError = action.payload
    },
    checkInRequested(
      state,
      _action: PayloadAction<{ eventId: string; occurrenceDate: string }>,
    ) {
      state.actionStatus = 'saving'
      state.actionError = null
    },
    checkInSucceeded(state, action: PayloadAction<SessionCheckInsResult>) {
      applyResult(state, action.payload)
      state.actionStatus = 'idle'
    },
    checkInFailed(state, action: PayloadAction<string>) {
      state.actionStatus = 'error'
      state.actionError = action.payload
    },
    reset() {
      return initialState
    },
  },
})

export const sessionCheckInsActions = sessionCheckInsSlice.actions
export const sessionCheckInsReducer = sessionCheckInsSlice.reducer

const fetchListEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionCheckInsActions.fetchListRequested.type),
    exhaustMap((action: ReturnType<typeof sessionCheckInsActions.fetchListRequested>) =>
      from(
        sessionTokensApi.listCheckIns(action.payload.eventId, action.payload.occurrenceDate),
      ).pipe(
        map((result) => sessionCheckInsActions.fetchListSucceeded(result)),
        catchError((err: unknown) =>
          of(
            sessionCheckInsActions.fetchListFailed(
              err instanceof Error ? err.message : 'Failed to load check-ins',
            ),
          ),
        ),
      ),
    ),
  )

const checkInEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sessionCheckInsActions.checkInRequested.type),
    exhaustMap((action: ReturnType<typeof sessionCheckInsActions.checkInRequested>) =>
      from(sessionTokensApi.checkIn(action.payload.eventId, action.payload.occurrenceDate)).pipe(
        map((result) => sessionCheckInsActions.checkInSucceeded(result)),
        catchError((err: unknown) =>
          of(
            sessionCheckInsActions.checkInFailed(
              err instanceof Error ? err.message : 'Failed to check in',
            ),
          ),
        ),
      ),
    ),
  )

export const sessionCheckInsEpics = combineEpics(fetchListEpic, checkInEpic)
