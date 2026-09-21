import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, filter, map, withLatestFrom } from 'rxjs/operators'
import { isFresh } from '@/shared/store/cacheUtils'
import { pushBroadcastApi } from '@/features/settings/basic/services/pushBroadcastApi'
import { pushBroadcastActions } from '@/features/settings/basic/store/pushBroadcastSlice'

type PushBroadcastEpic = Epic

const loadTargetsEpic: PushBroadcastEpic = (action$, state$) =>
  action$.pipe(
    ofType(pushBroadcastActions.loadTargetsRequested.type),
    withLatestFrom(state$),
    filter(([action, state]) => {
      const payload = (action as ReturnType<typeof pushBroadcastActions.loadTargetsRequested>).payload
      const slice = (state as unknown as { pushBroadcast: { targetsFetchedAt: number | null } })
        .pushBroadcast
      return Boolean(payload?.force) || !isFresh(slice.targetsFetchedAt)
    }),
    exhaustMap(() =>
      from(pushBroadcastApi.getTargets()).pipe(
        map((stats) => pushBroadcastActions.loadTargetsSucceeded(stats)),
        catchError((err: Error) => of(pushBroadcastActions.loadTargetsFailed(err.message))),
      ),
    ),
  )

const broadcastEpic: PushBroadcastEpic = (action$, state$) =>
  action$.pipe(
    ofType(pushBroadcastActions.broadcastRequested.type),
    withLatestFrom(state$),
    exhaustMap(([action]) => {
      const payload = (action as ReturnType<typeof pushBroadcastActions.broadcastRequested>).payload
      return from(pushBroadcastApi.broadcast(payload)).pipe(
        map((result) => pushBroadcastActions.broadcastSucceeded(result)),
        catchError((err: Error) => of(pushBroadcastActions.broadcastFailed(err.message))),
      )
    }),
  )

export const pushBroadcastEpics = combineEpics(loadTargetsEpic, broadcastEpic)
