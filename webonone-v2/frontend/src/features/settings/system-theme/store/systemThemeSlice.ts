import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ColorMode } from '@webonone/theme'
import type { ThemeFormValues } from '../schemas/themeFormSchema'
import type { ApiTheme, PreferencesResponse } from '../services/themeApi'

interface SystemThemeState {
  themes: ApiTheme[]
  preferences: PreferencesResponse | null
  status: 'idle' | 'loading' | 'saving' | 'error'
  error: string | null
}

const initialState: SystemThemeState = {
  themes: [],
  preferences: null,
  status: 'idle',
  error: null,
}

export const systemThemeSlice = createSlice({
  name: 'systemTheme',
  initialState,
  reducers: {
    loadThemesRequested(state) {
      state.status = 'loading'
      state.error = null
    },
    loadThemesSucceeded(state, action: PayloadAction<ApiTheme[]>) {
      state.themes = action.payload
      state.status = 'idle'
    },
    loadThemesFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    loadPreferencesRequested(state) {
      state.status = 'loading'
      state.error = null
    },
    loadPreferencesSucceeded(state, action: PayloadAction<PreferencesResponse>) {
      state.preferences = action.payload
      state.status = 'idle'
    },
    loadPreferencesFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    createThemeRequested(state, _action: PayloadAction<ThemeFormValues>) {
      state.status = 'saving'
      state.error = null
    },
    updateThemeRequested(
      state,
      _action: PayloadAction<{ id: string; values: ThemeFormValues }>,
    ) {
      state.status = 'saving'
      state.error = null
    },
    saveThemeSucceeded(state, action: PayloadAction<ApiTheme>) {
      const idx = state.themes.findIndex((t) => t.id === action.payload.id)
      if (idx >= 0) {
        state.themes[idx] = action.payload
      } else {
        state.themes.push(action.payload)
      }
      state.status = 'idle'
    },
    saveThemeFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    deleteThemeRequested(state, _action: PayloadAction<string>) {
      state.status = 'saving'
      state.error = null
    },
    deleteThemeSucceeded(state, action: PayloadAction<string>) {
      state.themes = state.themes.filter((t) => t.id !== action.payload)
      state.status = 'idle'
    },
    deleteThemeFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    patchPreferencesRequested(
      state,
      _action: PayloadAction<{ activeThemeId?: string; colorMode?: ColorMode }>,
    ) {
      state.status = 'saving'
      state.error = null
    },
    patchPreferencesSucceeded(state, action: PayloadAction<PreferencesResponse>) {
      state.preferences = action.payload
      state.status = 'idle'
    },
    patchPreferencesFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    clearError(state) {
      state.error = null
      if (state.status === 'error') {
        state.status = 'idle'
      }
    },
  },
})

export const systemThemeReducer = systemThemeSlice.reducer
export const systemThemeActions = systemThemeSlice.actions
