import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { isFresh } from '@/shared/store/cacheUtils'
import { aiSettingsApi } from '@/features/settings/basic/services/aiSettingsApi'
import { aiSettingsActions } from './aiSettingsSlice'

type AiSettingsEpic = Epic

const loadUserSettingsEpic: AiSettingsEpic = (action$, state$) =>
  action$.pipe(
    ofType(aiSettingsActions.loadUserSettingsRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof aiSettingsActions.loadUserSettingsRequested>).payload
      const aiState = (state as unknown as { aiSettings: { userFetchedAt: number | null } }).aiSettings
      return Boolean(payload?.force) || !isFresh(aiState.userFetchedAt)
    }),
    exhaustMap(([, state]) => {
      const token = (state as unknown as { auth: { accessToken: string | null } }).auth.accessToken
      if (!token) {
        return of(aiSettingsActions.loadUserSettingsFailed('Not signed in'))
      }
      return from(aiSettingsApi.getMine(token)).pipe(
        map((settings) => aiSettingsActions.loadUserSettingsSucceeded(settings)),
        catchError((err: Error) => of(aiSettingsActions.loadUserSettingsFailed(err.message))),
      )
    }),
  )

const patchUserSettingsEpic: AiSettingsEpic = (action$, state$) =>
  action$.pipe(
    ofType(aiSettingsActions.patchUserSettingsRequested.type),
    withLatestFrom(state$),
    exhaustMap(([action, state]) => {
      const token = (state as unknown as { auth: { accessToken: string | null } }).auth.accessToken
      if (!token) {
        return of(aiSettingsActions.patchUserSettingsFailed('Not signed in'))
      }
      const payload = (action as ReturnType<typeof aiSettingsActions.patchUserSettingsRequested>).payload
      return from(aiSettingsApi.patchMine(token, payload)).pipe(
        map((settings) => aiSettingsActions.patchUserSettingsSucceeded(settings)),
        catchError((err: Error) => of(aiSettingsActions.patchUserSettingsFailed(err.message))),
      )
    }),
  )

const loadPlatformSettingsEpic: AiSettingsEpic = (action$, state$) =>
  action$.pipe(
    ofType(aiSettingsActions.loadPlatformSettingsRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof aiSettingsActions.loadPlatformSettingsRequested>).payload
      const aiState = (state as unknown as { aiSettings: { platformFetchedAt: number | null } }).aiSettings
      return Boolean(payload?.force) || !isFresh(aiState.platformFetchedAt)
    }),
    exhaustMap(([, state]) => {
      const token = (state as unknown as { auth: { accessToken: string | null } }).auth.accessToken
      if (!token) {
        return of(aiSettingsActions.loadPlatformSettingsFailed('Not signed in'))
      }
      return from(aiSettingsApi.getPlatform(token)).pipe(
        map((settings) => aiSettingsActions.loadPlatformSettingsSucceeded(settings)),
        catchError((err: Error) => of(aiSettingsActions.loadPlatformSettingsFailed(err.message))),
      )
    }),
  )

const patchPlatformSettingsEpic: AiSettingsEpic = (action$, state$) =>
  action$.pipe(
    ofType(aiSettingsActions.patchPlatformSettingsRequested.type),
    withLatestFrom(state$),
    exhaustMap(([action, state]) => {
      const token = (state as unknown as { auth: { accessToken: string | null } }).auth.accessToken
      if (!token) {
        return of(aiSettingsActions.patchPlatformSettingsFailed('Not signed in'))
      }
      const payload = (action as ReturnType<typeof aiSettingsActions.patchPlatformSettingsRequested>).payload
      return from(aiSettingsApi.patchPlatform(token, payload)).pipe(
        map((settings) => aiSettingsActions.patchPlatformSettingsSucceeded(settings)),
        catchError((err: Error) => of(aiSettingsActions.patchPlatformSettingsFailed(err.message))),
      )
    }),
  )

export const aiSettingsEpics = combineEpics(
  loadUserSettingsEpic,
  patchUserSettingsEpic,
  loadPlatformSettingsEpic,
  patchPlatformSettingsEpic,
)
