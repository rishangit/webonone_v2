import { ofType } from 'redux-observable'
import type { Epic } from 'redux-observable'
import { combineEpics } from 'redux-observable'
import { catchError, debounceTime, exhaustMap, from, map, mergeMap, of } from 'rxjs'
import { feedbackApi } from '@/features/feedback/services/feedbackApi'
import { feedbackActions } from '@/features/feedback/store/feedbackSlice'

const loadFeedbackListEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.loadListRequested.type),
    debounceTime(400),
    mergeMap((action) => {
      const payload = (action as ReturnType<typeof feedbackActions.loadListRequested>).payload
      return from(
        feedbackApi.list({
          page: payload.page,
          pageSize: payload.pageSize,
          type: payload.type,
          status: payload.status,
          q: payload.q,
        }),
      ).pipe(
        map((result) =>
          feedbackActions.loadListSucceeded({
            items: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize,
            hasMore: result.hasMore,
            append: payload.append,
          }),
        ),
        catchError((err: Error) => of(feedbackActions.loadListFailed(err.message))),
      )
    }),
  )

const createFeedbackEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.createRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof feedbackActions.createRequested>).payload
      return from(feedbackApi.create(payload)).pipe(
        map((item) => feedbackActions.createSucceeded(item)),
        catchError((err: Error) => of(feedbackActions.createFailed(err.message))),
      )
    }),
  )

const updateFeedbackStatusEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.updateStatusRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof feedbackActions.updateStatusRequested>).payload
      return from(feedbackApi.updateStatus(payload.id, payload.status)).pipe(
        map((item) => feedbackActions.updateStatusSucceeded(item)),
        catchError((err: Error) => of(feedbackActions.updateStatusFailed(err.message))),
      )
    }),
  )

export const feedbackEpics = combineEpics(
  loadFeedbackListEpic,
  createFeedbackEpic,
  updateFeedbackStatusEpic,
)
