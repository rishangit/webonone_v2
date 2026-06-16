import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserProfile } from '../types/auth.types'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  forgotPasswordResetToken: string | null
  registrationComplete: boolean
  resetPasswordComplete: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  forgotPasswordResetToken: null,
  registrationComplete: false,
  resetPasswordComplete: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequested(state, _action: PayloadAction<{ email: string; password: string }>) {
      state.isLoading = true
      state.error = null
    },
    loginSucceeded(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user: UserProfile }>,
    ) {
      state.isLoading = false
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.user = action.payload.user
    },
    loginFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    googleLoginRequested(state, _action: PayloadAction<{ idToken: string }>) {
      state.isLoading = true
      state.error = null
    },
    registerRequested(
      state,
      _action: PayloadAction<{ email: string; password: string; firstName: string; lastName: string }>,
    ) {
      state.isLoading = true
      state.error = null
    },
    registerSucceeded(state) {
      state.isLoading = false
      state.registrationComplete = true
    },
    registerFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    forgotPasswordRequested(state, _action: PayloadAction<{ email: string }>) {
      state.isLoading = true
      state.error = null
      state.forgotPasswordResetToken = null
    },
    forgotPasswordSucceeded(state, action: PayloadAction<{ resetToken?: string }>) {
      state.isLoading = false
      state.forgotPasswordResetToken = action.payload.resetToken ?? null
    },
    forgotPasswordFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    resetPasswordRequested(
      state,
      _action: PayloadAction<{ token: string; newPassword: string }>,
    ) {
      state.isLoading = true
      state.error = null
    },
    resetPasswordSucceeded(state) {
      state.isLoading = false
      state.resetPasswordComplete = true
    },
    resetPasswordFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    clearAuthError(state) {
      state.error = null
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
