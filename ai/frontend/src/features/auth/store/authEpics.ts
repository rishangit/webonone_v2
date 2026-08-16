import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { apiClient } from '@/shared/services/apiClient'
import type { AiRole } from '../types/auth.types'
import { isFresh } from '@/shared/store/cacheUtils'
import { authActions } from './authSlice'

type AuthEpic = Epic

const profileFetchEpic: AuthEpic = (action$, state$) =>
  action$.pipe(
    ofType(authActions.profileFetchRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof authActions.profileFetchRequested>).payload
      const auth = (state as unknown as { auth: { lastProfileFetchedAt: number | null } }).auth
      if (payload?.force) return true
      return !isFresh(auth.lastProfileFetchedAt)
    }),
    exhaustMap(() =>
      from(
        apiClient<{ user: { role: AiRole; companyId?: string | null } }>('/me'),
      ).pipe(
        map((me) =>
          authActions.profileFetchSucceeded({
            role: me.user.role,
            companyId: me.user.companyId ?? null,
          }),
        ),
        catchError(() => of(authActions.profileFetchSkipped())),
      ),
    ),
  )

export const authEpics = combineEpics(profileFetchEpic)
