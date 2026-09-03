import { ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { companyAnalyticsApi } from '../services/companyAnalyticsApi'
import {
  analyticsActions,
  shouldLoadAnalytics,
  type AnalyticsState,
} from './analyticsSlice'

type AnalyticsEpic = Epic

const loadAnalyticsEpic: AnalyticsEpic = (action$, state$) =>
  action$.pipe(
    ofType(analyticsActions.loadRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof analyticsActions.loadRequested>).payload
      const slice = (state as unknown as { analytics: AnalyticsState }).analytics
      return shouldLoadAnalytics(slice, payload)
    }),
    exhaustMap(([action]) => {
      const payload = (action as ReturnType<typeof analyticsActions.loadRequested>).payload
      const request =
        payload.kind === 'platform'
          ? companyAnalyticsApi.getPlatform(payload.from, payload.to)
          : companyAnalyticsApi.getCompany(payload.from, payload.to)
      return from(request).pipe(
        map((data) =>
          payload.kind === 'platform'
            ? analyticsActions.loadPlatformSucceeded({
                data: data as Awaited<ReturnType<typeof companyAnalyticsApi.getPlatform>>,
                from: payload.from,
                to: payload.to,
                sessionKey: payload.sessionKey,
              })
            : analyticsActions.loadCompanySucceeded({
                data: data as Awaited<ReturnType<typeof companyAnalyticsApi.getCompany>>,
                from: payload.from,
                to: payload.to,
                sessionKey: payload.sessionKey,
              }),
        ),
        catchError((err: Error) => of(analyticsActions.loadFailed(err.message))),
      )
    }),
  )

export const analyticsEpics = loadAnalyticsEpic
