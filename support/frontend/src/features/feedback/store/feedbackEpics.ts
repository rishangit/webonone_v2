import { ofType } from 'redux-observable'
import type { Epic } from 'redux-observable'
import { combineEpics } from 'redux-observable'
import { catchError, debounceTime, exhaustMap, from, map, mergeMap, of, switchMap } from 'rxjs'
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

const updateFeedbackEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.updateRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof feedbackActions.updateRequested>).payload
      return from(feedbackApi.update(payload.id, payload.values)).pipe(
        map((item) => feedbackActions.updateSucceeded(item)),
        catchError((err: Error) => of(feedbackActions.updateFailed(err.message))),
      )
    }),
  )

const loadCommentsEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.loadCommentsRequested.type),
    switchMap((action) => {
      const reportId = (action as ReturnType<typeof feedbackActions.loadCommentsRequested>).payload
      return from(feedbackApi.listComments(reportId)).pipe(
        map((result) =>
          feedbackActions.loadCommentsSucceeded({ reportId, items: result.items }),
        ),
        catchError((err: Error) => of(feedbackActions.loadCommentsFailed(err.message))),
      )
    }),
  )

const createCommentEpic: Epic = (action$) =>
  action$.pipe(
    ofType(feedbackActions.commentCreateRequested.type),
    exhaustMap((action) => {
      const payload = (action as ReturnType<typeof feedbackActions.commentCreateRequested>).payload
      return from(feedbackApi.createComment(payload.reportId, payload.body)).pipe(
        map((comment) =>
          feedbackActions.commentCreateSucceeded({ reportId: payload.reportId, comment }),
        ),
        catchError((err: Error) => of(feedbackActions.commentCreateFailed(err.message))),
      )
    }),
  )

export const feedbackEpics = combineEpics(
  loadFeedbackListEpic,
  createFeedbackEpic,
  updateFeedbackStatusEpic,
  updateFeedbackEpic,
  loadCommentsEpic,
  createCommentEpic,
)
