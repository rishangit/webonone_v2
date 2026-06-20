import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UpdateProfileInput, UserProfile } from '../types/auth.types'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  forgotPasswordResetToken: string | null
  registrationComplete: boolean
  resetPasswordComplete: boolean
  isProfileLoading: boolean
  isProfileSaving: boolean
  profileError: string | null
  profileSaveSuccess: boolean
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
  isProfileLoading: false,
  isProfileSaving: false,
  profileError: null,
  profileSaveSuccess: false,
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
      action: PayloadAction<{
        accessToken: string
        refreshToken?: string | null
        user: UserProfile
      }>,
    ) {
      state.isLoading = false
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken ?? null
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
    profileFetchRequested(state, _action: PayloadAction<{ accessToken: string }>) {
      state.isProfileLoading = true
      state.profileError = null
      state.profileSaveSuccess = false
    },
    profileFetchSucceeded(state, action: PayloadAction<UserProfile>) {
      state.isProfileLoading = false
      state.user = action.payload
    },
    profileFetchFailed(state, action: PayloadAction<string>) {
      state.isProfileLoading = false
      state.profileError = action.payload
    },
    profileUpdateRequested(
      state,
      _action: PayloadAction<{ accessToken: string; body: UpdateProfileInput }>,
    ) {
      state.isProfileSaving = true
      state.profileError = null
      state.profileSaveSuccess = false
    },
    profileUpdateSucceeded(state, action: PayloadAction<UserProfile>) {
      state.isProfileSaving = false
      state.user = action.payload
      state.profileSaveSuccess = true
    },
    profileUpdateFailed(state, action: PayloadAction<string>) {
      state.isProfileSaving = false
      state.profileError = action.payload
    },
    clearProfileSaveSuccess(state) {
      state.profileSaveSuccess = false
    },
    clearAuthError(state) {
      state.error = null
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.error = null
      state.profileError = null
      state.profileSaveSuccess = false
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
