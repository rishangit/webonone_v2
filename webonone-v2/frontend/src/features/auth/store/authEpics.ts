import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, tap, withLatestFrom } from 'rxjs/operators'
import { normalizeLocale } from '@webonone/i18n'
import { isFresh } from '@/shared/store/cacheUtils'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import { fetchIdentityUser } from '../services/identityUserApi'
import { authActions } from './authSlice'

type AuthEpic = Epic

const profileRefreshEpic: AuthEpic = (action$, state$) =>
  action$.pipe(
    ofType(authActions.profileFetchRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const authState = (
        state as unknown as { auth: { accessToken: string | null; lastProfileFetchedAt: number | null } }
      ).auth
      if (!authState.accessToken) return false
      const payload = (action as ReturnType<typeof authActions.profileFetchRequested>).payload
      return Boolean(payload?.force) || !isFresh(authState.lastProfileFetchedAt)
    }),
    exhaustMap(([, state]) => {
      const accessToken = (
        state as unknown as { auth: { accessToken: string | null } }
      ).auth.accessToken!
      return from(fetchIdentityUser(accessToken)).pipe(
        tap((user) => {
          if (user.locale) {
            void changeAppLocale(normalizeLocale(user.locale))
          }
        }),
        map((user) => authActions.profileFetchSucceeded(user)),
        catchError(() => of(authActions.profileFetchSkipped())),
      )
    }),
  )

export const authEpics = combineEpics(profileRefreshEpic)
