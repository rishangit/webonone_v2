import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import { adminCompaniesApi } from '@/features/home/services/adminCompaniesApi'
import {
  homeDashboardActions,
  shouldLoadDashboardCompanies,
  shouldLoadHomeDashboard,
  type HomeDashboardState,
} from './homeDashboardSlice'

type HomeDashboardEpic = Epic

const loadHomeDashboardEpic: HomeDashboardEpic = (action$, state$) =>
  action$.pipe(
    ofType(homeDashboardActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof homeDashboardActions.loadRequested>).payload
      const dash = (state as unknown as { homeDashboard: HomeDashboardState }).homeDashboard
      return shouldLoadHomeDashboard(dash, payload)
    }),
    exhaustMap(([action]) => {
      const payload = (action as ReturnType<typeof homeDashboardActions.loadRequested>).payload
      return from(eventsApi.listOccurrences(payload.from, payload.to)).pipe(
        map((items) =>
          homeDashboardActions.loadSucceeded({
            items,
            from: payload.from,
            to: payload.to,
            sessionKey: payload.sessionKey,
          }),
        ),
        catchError((err: Error) => of(homeDashboardActions.loadFailed(err.message))),
      )
    }),
  )

const loadDashboardCompaniesEpic: HomeDashboardEpic = (action$, state$) =>
  action$.pipe(
    ofType(homeDashboardActions.loadCompaniesRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof homeDashboardActions.loadCompaniesRequested>)
        .payload
      const dash = (state as unknown as { homeDashboard: HomeDashboardState }).homeDashboard
      return shouldLoadDashboardCompanies(dash, payload)
    }),
    exhaustMap(() =>
      from(adminCompaniesApi.listAllCompanies()).pipe(
        map((items) => homeDashboardActions.loadCompaniesSucceeded(items)),
        catchError((err: Error) => of(homeDashboardActions.loadCompaniesFailed(err.message))),
      ),
    ),
  )

export const homeDashboardEpics = combineEpics(loadHomeDashboardEpic, loadDashboardCompaniesEpic)
