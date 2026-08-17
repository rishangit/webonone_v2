import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authActions } from '@/features/auth/store/authSlice'
import { isFresh } from '@/shared/store/cacheUtils'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'
import type {
  PlatformAiSettingsFormValues,
  UserAiSettingsFormValues,
} from '@/features/settings/basic/schemas/aiSettingsSchemas'

interface AiSettingsState {
  userSettings: AiSettingsResponse | null
  platformSettings: AiSettingsResponse | null
  userFetchedAt: number | null
  platformFetchedAt: number | null
  status: 'idle' | 'loading' | 'saving' | 'error'
  error: string | null
}

const initialState: AiSettingsState = {
  userSettings: null,
  platformSettings: null,
  userFetchedAt: null,
  platformFetchedAt: null,
  status: 'idle',
  error: null,
}

export const aiSettingsSlice = createSlice({
  name: 'aiSettings',
  initialState,
  reducers: {
    loadUserSettingsRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.userFetchedAt)) {
        return
      }
      state.status = 'loading'
      state.error = null
    },
    loadUserSettingsSucceeded(state, action: PayloadAction<AiSettingsResponse>) {
      state.userSettings = action.payload
      state.userFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadUserSettingsFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    patchUserSettingsRequested(state, _action: PayloadAction<UserAiSettingsFormValues>) {
      state.status = 'saving'
      state.error = null
    },
    patchUserSettingsSucceeded(state, action: PayloadAction<AiSettingsResponse>) {
      state.userSettings = action.payload
      state.userFetchedAt = Date.now()
      state.status = 'idle'
    },
    patchUserSettingsFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    loadPlatformSettingsRequested(state, action: PayloadAction<{ force?: boolean } | undefined>) {
      if (!action.payload?.force && isFresh(state.platformFetchedAt)) {
        return
      }
      state.status = 'loading'
      state.error = null
    },
    loadPlatformSettingsSucceeded(state, action: PayloadAction<AiSettingsResponse>) {
      state.platformSettings = action.payload
      state.platformFetchedAt = Date.now()
      state.status = 'idle'
    },
    loadPlatformSettingsFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    patchPlatformSettingsRequested(state, _action: PayloadAction<PlatformAiSettingsFormValues>) {
      state.status = 'saving'
      state.error = null
    },
    patchPlatformSettingsSucceeded(state, action: PayloadAction<AiSettingsResponse>) {
      state.platformSettings = action.payload
      state.platformFetchedAt = Date.now()
      state.status = 'idle'
    },
    patchPlatformSettingsFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authActions.logout, () => initialState)
  },
})

export const aiSettingsActions = aiSettingsSlice.actions
export const aiSettingsReducer = aiSettingsSlice.reducer
