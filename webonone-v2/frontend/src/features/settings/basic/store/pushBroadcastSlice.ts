import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PushBroadcastFormValues } from '@/features/settings/basic/schemas/pushBroadcastSchemas'
import type {
  PushBroadcastResult,
  PushTargetStats,
} from '@/features/settings/basic/services/pushBroadcastApi'

export type PushBroadcastState = {
  targets: PushTargetStats | null
  targetsStatus: 'idle' | 'loading' | 'success' | 'error'
  targetsError: string | null
  targetsFetchedAt: number | null
  broadcastStatus: 'idle' | 'loading' | 'success' | 'error'
  broadcastError: string | null
  lastResult: PushBroadcastResult | null
}

const initialState: PushBroadcastState = {
  targets: null,
  targetsStatus: 'idle',
  targetsError: null,
  targetsFetchedAt: null,
  broadcastStatus: 'idle',
  broadcastError: null,
  lastResult: null,
}

const pushBroadcastSlice = createSlice({
  name: 'pushBroadcast',
  initialState,
  reducers: {
    loadTargetsRequested(state, _action: PayloadAction<{ force?: boolean } | undefined>) {
      state.targetsStatus = 'loading'
      state.targetsError = null
    },
    loadTargetsSucceeded(state, action: PayloadAction<PushTargetStats>) {
      state.targets = action.payload
      state.targetsStatus = 'success'
      state.targetsFetchedAt = Date.now()
    },
    loadTargetsFailed(state, action: PayloadAction<string>) {
      state.targetsStatus = 'error'
      state.targetsError = action.payload
    },
    broadcastRequested(state, _action: PayloadAction<PushBroadcastFormValues>) {
      state.broadcastStatus = 'loading'
      state.broadcastError = null
    },
    broadcastSucceeded(state, action: PayloadAction<PushBroadcastResult>) {
      state.broadcastStatus = 'success'
      state.lastResult = action.payload
    },
    broadcastFailed(state, action: PayloadAction<string>) {
      state.broadcastStatus = 'error'
      state.broadcastError = action.payload
    },
    resetBroadcastStatus(state) {
      state.broadcastStatus = 'idle'
      state.broadcastError = null
    },
  },
})

export const pushBroadcastActions = pushBroadcastSlice.actions
export const pushBroadcastReducer = pushBroadcastSlice.reducer
