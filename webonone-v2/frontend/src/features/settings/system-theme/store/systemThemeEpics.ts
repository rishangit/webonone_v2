import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map, mergeMap, switchMap } from 'rxjs/operators'
import { authActions } from '@/features/auth/store/authSlice'
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
            systemThemeActions.loadPreferencesRequested(),
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

const loadThemesEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.loadThemesRequested.type),
    switchMap(() =>
      from(themeApi.listThemes()).pipe(
        map((themes) => systemThemeActions.loadThemesSucceeded(themes)),
        catchError((err: Error) => of(systemThemeActions.loadThemesFailed(err.message))),
      ),
    ),
  )

const loadPreferencesEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(systemThemeActions.loadPreferencesRequested.type),
    switchMap(() =>
      from(themeApi.getPreferences()).pipe(
        map((preferences) => systemThemeActions.loadPreferencesSucceeded(preferences)),
        catchError((err: Error) => of(systemThemeActions.loadPreferencesFailed(err.message))),
      ),
    ),
  )

const loadOnLoginEpic: SystemThemeEpic = (action$) =>
  action$.pipe(
    ofType(authActions.loginSuccess.type),
    mergeMap(() => of(systemThemeActions.loadPreferencesRequested())),
  )

export const systemThemeEpics = combineEpics(
  loadThemesEpic,
  loadPreferencesEpic,
  loadOnLoginEpic,
  createThemeEpic,
  updateThemeEpic,
  deleteThemeEpic,
  patchPreferencesEpic,
)
