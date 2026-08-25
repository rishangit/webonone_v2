import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of, type Observable } from 'rxjs'
import { catchError, exhaustMap, filter, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators'
import { normalizeLocale } from '@webonone/i18n'
import { authApi } from '@/shared/services/authApi'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { clearResetSessionToken } from '../utils/resetSessionStorage'
import { clearRegistrationWizardStorage } from '../utils/resetRegistrationWizard'
import { authActions } from './authSlice'
import type { RootState } from '@/app/store'

type AuthEpic = Epic

const loginEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.loginRequested.type),
    exhaustMap((action: ReturnType<typeof authActions.loginRequested>) =>
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
    exhaustMap((action: ReturnType<typeof authActions.registerRequested>) =>
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
        mergeMap(() => {
          clearResetSessionToken()
          return of(authActions.logout(), authActions.resetPasswordSucceeded())
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
        mergeMap(() => of(authActions.logout(), authActions.resetPasswordSucceeded())),
        catchError((err: Error) => of(authActions.resetPasswordFailed(err.message))),
      ),
    ),
  )

const googleLoginEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.googleLoginRequested.type),
    exhaustMap((action: ReturnType<typeof authActions.googleLoginRequested>) =>
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
    // Latest request wins — embed INIT can re-request while an earlier fetch is in flight.
    switchMap(() =>
      from(authApi.getMe()).pipe(
        map((result) => authActions.profileFetchSucceeded(result.user)),
        catchError((err: Error) => of(authActions.profileFetchFailed(err.message))),
      ),
    ),
  )

const profileFetchLogoutEpic: AuthEpic = (action$, state$) =>
  action$.pipe(
    ofType(authActions.profileFetchFailed.type),
    withLatestFrom(state$ as unknown as Observable<RootState>),
    filter(([, state]) => Boolean(state.auth.accessToken) && !state.auth.user),
    map(() => authActions.logout()),
  )

const profileUpdateEpic: AuthEpic = (action$) =>
  action$.pipe(
    ofType(authActions.profileUpdateRequested.type),
    exhaustMap((action: ReturnType<typeof authActions.profileUpdateRequested>) =>
      from(authApi.patchMe(action.payload.body)).pipe(
        tap((result) => {
          if (result.user.locale) {
            void changeAppLocale(normalizeLocale(result.user.locale))
          }
        }),
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
  profileFetchLogoutEpic,
  profileUpdateEpic,
)
