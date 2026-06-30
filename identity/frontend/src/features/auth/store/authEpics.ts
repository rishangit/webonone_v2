import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map, mergeMap } from 'rxjs/operators'
import { authApi } from '../services/authApi'
import { clearResetSessionToken } from '../utils/resetSessionStorage'
import { clearRegistrationWizardStorage } from '../utils/resetRegistrationWizard'
import { authActions } from './authSlice'

type AuthEpic = Epic

const loginEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.loginRequested.type),
    mergeMap((action: ReturnType<typeof authActions.loginRequested>) =>
      from(authApi.login(action.payload)).pipe(
        map((result) =>
          authActions.loginSucceeded({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
          }),
        ),
        catchError((err: Error) => of(authActions.loginFailed(err.message))),
      ),
    ),
  )

const registerEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.registerRequested.type),
    mergeMap((action: ReturnType<typeof authActions.registerRequested>) =>
      from(authApi.completeRegistration(action.payload)).pipe(
        map(() => {
          clearRegistrationWizardStorage()
          return authActions.registerSucceeded()
        }),
        catchError((err: Error) => of(authActions.registerFailed(err.message))),
      ),
    ),
  )

const forgotPasswordEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.forgotPasswordRequested.type),
    mergeMap((action: ReturnType<typeof authActions.forgotPasswordRequested>) =>
      from(authApi.forgotPassword(action.payload)).pipe(
        map(() => authActions.forgotPasswordSucceeded()),
        catchError((err: Error) => of(authActions.forgotPasswordFailed(err.message))),
      ),
    ),
  )

const resetPasswordEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.resetPasswordRequested.type),
    mergeMap((action: ReturnType<typeof authActions.resetPasswordRequested>) =>
      from(authApi.resetPassword(action.payload)).pipe(
        map(() => {
          clearResetSessionToken()
          return authActions.resetPasswordSucceeded()
        }),
        catchError((err: Error) => of(authActions.resetPasswordFailed(err.message))),
      ),
    ),
  )

const legacyResetPasswordEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.legacyResetPasswordRequested.type),
    mergeMap((action: ReturnType<typeof authActions.legacyResetPasswordRequested>) =>
      from(authApi.resetPasswordWithToken(action.payload)).pipe(
        map(() => authActions.resetPasswordSucceeded()),
        catchError((err: Error) => of(authActions.resetPasswordFailed(err.message))),
      ),
    ),
  )

const googleLoginEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.googleLoginRequested.type),
    mergeMap((action: ReturnType<typeof authActions.googleLoginRequested>) =>
      from(authApi.googleLogin(action.payload)).pipe(
        map((result) =>
          authActions.loginSucceeded({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
          }),
        ),
        catchError((err: Error) => of(authActions.loginFailed(err.message))),
      ),
    ),
  )

const profileFetchEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.profileFetchRequested.type),
    exhaustMap((action: ReturnType<typeof authActions.profileFetchRequested>) =>
      from(authApi.getMe(action.payload.accessToken)).pipe(
        map((result) => authActions.profileFetchSucceeded(result.user)),
        catchError((err: Error) => of(authActions.profileFetchFailed(err.message))),
      ),
    ),
  )

const profileUpdateEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.profileUpdateRequested.type),
    exhaustMap((action: ReturnType<typeof authActions.profileUpdateRequested>) =>
      from(authApi.patchMe(action.payload.accessToken, action.payload.body)).pipe(
        map((result) => authActions.profileUpdateSucceeded(result.user)),
        catchError((err: Error) => of(authActions.profileUpdateFailed(err.message))),
      ),
    ),
  )

export const authEpics = combineEpics(
  loginEpic,
  googleLoginEpic,
  registerEpic,
  forgotPasswordEpic,
  resetPasswordEpic,
  legacyResetPasswordEpic,
  profileFetchEpic,
  profileUpdateEpic,
)
