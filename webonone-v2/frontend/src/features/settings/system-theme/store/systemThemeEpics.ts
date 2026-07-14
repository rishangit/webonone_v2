import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, mergeMap, withLatestFrom } from 'rxjs/operators'
import { isFresh } from '@/shared/store/cacheUtils'
import { themeApi } from '../services/themeApi'
import { systemThemeActions } from './systemThemeSlice'

type SystemThemeEpic = Epic

const createThemeEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.createThemeRequested.type),
    exhaustMap((action: ReturnType<typeof systemThemeActions.createThemeRequested>) =>
      from(themeApi.createTheme(action.payload)).pipe(
        mergeMap((theme) =>
          of(
            systemThemeActions.saveThemeSucceeded(theme),
            systemThemeActions.patchPreferencesRequested({ activeThemeId: theme.id }),
          ),
        ),
        catchError((err: Error) => of(systemThemeActions.saveThemeFailed(err.message))),
      ),
    ),
  )

const updateThemeEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.updateThemeRequested.type),
    exhaustMap((action: ReturnType<typeof systemThemeActions.updateThemeRequested>) =>
      from(themeApi.updateTheme(action.payload.id, action.payload.values)).pipe(
        map((theme) => systemThemeActions.saveThemeSucceeded(theme)),
        catchError((err: Error) => of(systemThemeActions.saveThemeFailed(err.message))),
      ),
    ),
  )

const deleteThemeEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.deleteThemeRequested.type),
    exhaustMap((action: ReturnType<typeof systemThemeActions.deleteThemeRequested>) =>
      from(themeApi.deleteTheme(action.payload)).pipe(
        mergeMap(() =>
          of(
            systemThemeActions.deleteThemeSucceeded(action.payload),
            systemThemeActions.loadPreferencesRequested({ force: true }),
          ),
        ),
        catchError((err: Error) => of(systemThemeActions.deleteThemeFailed(err.message))),
      ),
    ),
  )

const patchPreferencesEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.patchPreferencesRequested.type),
    exhaustMap((action: ReturnType<typeof systemThemeActions.patchPreferencesRequested>) =>
      from(themeApi.patchPreferences(action.payload)).pipe(
        map((preferences) => systemThemeActions.patchPreferencesSucceeded(preferences)),
        catchError((err: Error) => of(systemThemeActions.patchPreferencesFailed(err.message))),
      ),
    ),
  )

const loadThemesEpic: SystemThemeEpic = (action$, state$) =>
  action$.pipe(
    ofType(systemThemeActions.loadThemesRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof systemThemeActions.loadThemesRequested>).payload
      const themeState = (state as unknown as { systemTheme: { themesFetchedAt: number | null } }).systemTheme
      return Boolean(payload?.force) || !isFresh(themeState.themesFetchedAt)
    }),
    exhaustMap(() =>
      from(themeApi.listThemes()).pipe(
        map((themes) => systemThemeActions.loadThemesSucceeded(themes)),
        catchError((err: Error) => of(systemThemeActions.loadThemesFailed(err.message))),
      ),
    ),
  )

const loadPreferencesEpic: SystemThemeEpic = (action$, state$) =>
  action$.pipe(
    ofType(systemThemeActions.loadPreferencesRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof systemThemeActions.loadPreferencesRequested>).payload
      const themeState = (state as unknown as { systemTheme: { preferencesFetchedAt: number | null } }).systemTheme
      return Boolean(payload?.force) || !isFresh(themeState.preferencesFetchedAt)
    }),
    exhaustMap(() =>
      from(themeApi.getPreferences()).pipe(
        map((preferences) => systemThemeActions.loadPreferencesSucceeded(preferences)),
        catchError((err: Error) => of(systemThemeActions.loadPreferencesFailed(err.message))),
      ),
    ),
  )

export const systemThemeEpics = combineEpics(
  loadThemesEpic,
  loadPreferencesEpic,
  createThemeEpic,
  updateThemeEpic,
  deleteThemeEpic,
  patchPreferencesEpic,
)
