import { ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { eventsApi } from '@/features/calendar/services/eventsApi'
import {
  homeDashboardActions,
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

export const homeDashboardEpics = loadHomeDashboardEpic
