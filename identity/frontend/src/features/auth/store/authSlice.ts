import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UpdateProfileInput, UserProfile } from '@/shared/types/auth.types'
import { loadStoredAuthSession, persistAuthSession } from '../utils/authStorage'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  registrationComplete: boolean
  resetPasswordComplete: boolean
  isProfileLoading: boolean
  isProfileSaving: boolean
  profileError: string | null
  profileSaveSuccess: boolean
}

const storedSession = loadStoredAuthSession()

function syncPersistedSession(state: AuthState) {
  if (state.accessToken && state.user) {
    persistAuthSession({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
    })
  } else {
    persistAuthSession(null)
  }
}

const initialState: AuthState = {
  user: storedSession?.user ?? null,
  accessToken: storedSession?.accessToken ?? null,
  refreshToken: storedSession?.refreshToken ?? null,
  isLoading: false,
  error: null,
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
      syncPersistedSession(state)
    },
    /**
     * Embed JWT handoff: set token without wiping a richer same-user profile
     * already loaded via `/auth/me`. Stub only when no matching user is present.
     */
    embedAccessTokenReceived(
      state,
      action: PayloadAction<{
        accessToken: string
        stubUser: UserProfile
      }>,
    ) {
      const { accessToken, stubUser } = action.payload
      state.accessToken = accessToken
      const keep =
        state.user &&
        state.user.id === stubUser.id &&
        !(
          !state.user.firstName &&
          !state.user.lastName &&
          state.user.displayName === state.user.email
        )
      if (!keep) {
        state.user = stubUser
      }
      state.isProfileLoading = true
      state.profileError = null
      syncPersistedSession(state)
    },
    loginFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    googleLoginRequested(
      state,
      _action: PayloadAction<{ idToken?: string; accessToken?: string }>,
    ) {
      state.isLoading = true
      state.error = null
    },
    registerRequested(
      state,
      _action: PayloadAction<{
        registrationSessionToken: string
        firstName: string
        lastName: string
        password: string
      }>,
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
    resetRegistrationFlow(state) {
      state.isLoading = false
      state.error = null
      state.registrationComplete = false
    },
    forgotPasswordRequested(state, _action: PayloadAction<{ email: string }>) {
      state.isLoading = true
      state.error = null
    },
    forgotPasswordSucceeded(state) {
      state.isLoading = false
    },
    forgotPasswordFailed(state, action: PayloadAction<string>) {
      state.isLoading = false
      state.error = action.payload
    },
    resetPasswordRequested(
      state,
      _action: PayloadAction<{ resetSessionToken: string; newPassword: string }>,
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
    legacyResetPasswordRequested(
      state,
      _action: PayloadAction<{ token: string; newPassword: string }>,
    ) {
      state.isLoading = true
      state.error = null
    },
    profileFetchRequested(state, _action: PayloadAction<{ force?: boolean } | undefined>) {
      state.isProfileLoading = true
      state.profileError = null
      state.profileSaveSuccess = false
    },
    profileFetchSucceeded(state, action: PayloadAction<UserProfile>) {
      state.isProfileLoading = false
      state.user = action.payload
      syncPersistedSession(state)
    },
    profileFetchFailed(state, action: PayloadAction<string>) {
      state.isProfileLoading = false
      state.profileError = action.payload
    },
    profileUpdateRequested(state, _action: PayloadAction<{ body: UpdateProfileInput }>) {
      state.isProfileSaving = true
      state.profileError = null
      state.profileSaveSuccess = false
    },
    profileUpdateSucceeded(state, action: PayloadAction<UserProfile>) {
      state.isProfileSaving = false
      state.user = action.payload
      state.profileSaveSuccess = true
      syncPersistedSession(state)
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
      state.resetPasswordComplete = false
      syncPersistedSession(state)
    },
  },
})

export const authReducer = authSlice.reducer
export const authActions = authSlice.actions
