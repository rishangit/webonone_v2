import { type Epic } from 'redux-observable'
import { from, of, timer, EMPTY } from 'rxjs'
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  withLatestFrom,
} from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { notificationsApi } from '../services/notificationsApi'
import {
  notificationsActions,
  type NotificationsListRequest,
} from './notificationsSlice'

type NotificationsEpic = Epic

const POLL_MS = 30_000
const DEFAULT_LIST_LIMIT = 20

const pollIntervalEpic: NotificationsEpic = (_action$, state$) =>
  timer(0, POLL_MS).pipe(
    withLatestFrom(state$),
    filter(([, state]) =>
      Boolean((state as unknown as { auth: { accessToken: string | null } }).auth.accessToken),
    ),
    map(() => notificationsActions.pollUnreadRequested()),
  )

const pollUnreadEpic: NotificationsEpic = (action$, state$) =>
  action$.pipe(
    ofType(notificationsActions.pollUnreadRequested.type),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const previousCount = (
        state as unknown as { notifications: { unreadCount: number } }
      ).notifications.unreadCount
      return from(notificationsApi.unreadCount()).pipe(
        mergeMap(async ({ count }) => {
          let latestTitle: string | null = null
          if (count > previousCount) {
            try {
              const list = await notificationsApi.list({ limit: 1 })
              latestTitle = list.items[0]?.title ?? null
            } catch {
              latestTitle = null
            }
          }
          return notificationsActions.pollUnreadSucceeded({
            count,
            previousCount,
            latestTitle,
          })
        }),
        catchError((err: Error) => of(notificationsActions.pollUnreadFailed(err.message))),
      )
    }),
  )

const listEpic: NotificationsEpic = (action$) =>
  action$.pipe(
    ofType(notificationsActions.listRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof notificationsActions.listRequested>)
        .payload as NotificationsListRequest
      const limit = payload.limit ?? DEFAULT_LIST_LIMIT
      const mode = payload.mode
      return from(
        notificationsApi.list({
          limit,
          before: payload.before,
        }),
      ).pipe(
        map((result) =>
          notificationsActions.listSucceeded({
            items: result.items,
            mode,
            hasMore: result.items.length === limit,
          }),
        ),
        catchError((err: Error) => of(notificationsActions.listFailed(err.message))),
      )
    }),
  )

const markReadEpic: NotificationsEpic = (action$) =>
  action$.pipe(
    ofType(notificationsActions.markReadRequested.type),
    mergeMap((action) => {
      const id = (action as ReturnType<typeof notificationsActions.markReadRequested>).payload
      return from(notificationsApi.markRead(id)).pipe(
        map((item) => notificationsActions.markReadSucceeded(item)),
        catchError(() => EMPTY),
      )
    }),
  )

const markAllReadEpic: NotificationsEpic = (action$) =>
  action$.pipe(
    ofType(notificationsActions.markAllReadRequested.type),
    exhaustMap(() =>
      from(notificationsApi.markAllRead()).pipe(
        map(() => notificationsActions.markAllReadSucceeded()),
        catchError(() => EMPTY),
      ),
    ),
  )

export const notificationsEpics = [
  pollIntervalEpic,
  pollUnreadEpic,
  listEpic,
  markReadEpic,
  markAllReadEpic,
]
