import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { smsApi, type SendSmsBody } from '@/shared/services/smsApi'
import type { TemplatePreviewResult } from '@/shared/types/sms.types'

interface SendState {
  sendStatus: 'idle' | 'sending' | 'error'
  sendError: string | null
  sendSuccess: string | null
  testStatus: 'idle' | 'sending' | 'error'
  testError: string | null
  preview: TemplatePreviewResult | null
  previewStatus: 'idle' | 'loading' | 'error'
  previewError: string | null
}

const initialState: SendState = {
  sendStatus: 'idle',
  sendError: null,
  sendSuccess: null,
  testStatus: 'idle',
  testError: null,
  preview: null,
  previewStatus: 'idle',
  previewError: null,
}

export const sendSlice = createSlice({
  name: 'send',
  initialState,
  reducers: {
    sendSmsRequested(state, _action: PayloadAction<SendSmsBody>) {
      state.sendStatus = 'sending'
      state.sendError = null
      state.sendSuccess = null
    },
    sendSmsSucceeded(state, action: PayloadAction<{ queueId: string }>) {
      state.sendStatus = 'idle'
      state.sendSuccess = action.payload.queueId
      state.preview = null
    },
    sendSmsFailed(state, action: PayloadAction<string>) {
      state.sendStatus = 'error'
      state.sendError = action.payload
    },
    sendTestSmsRequested(state, _action: PayloadAction<SendSmsBody>) {
      state.testStatus = 'sending'
      state.testError = null
    },
    sendTestSmsSucceeded(state) {
      state.testStatus = 'idle'
    },
    sendTestSmsFailed(state, action: PayloadAction<string>) {
      state.testStatus = 'error'
      state.testError = action.payload
    },
    previewRequested(
      state,
      _action: PayloadAction<{ id: string; payload: Record<string, string> }>,
    ) {
      state.previewStatus = 'loading'
      state.previewError = null
    },
    previewSucceeded(state, action: PayloadAction<TemplatePreviewResult>) {
      state.preview = action.payload
      state.previewStatus = 'idle'
    },
    previewFailed(state, action: PayloadAction<string>) {
      state.previewStatus = 'error'
      state.previewError = action.payload
      state.preview = null
    },
    clearSendMessages(state) {
      state.sendError = null
      state.sendSuccess = null
      state.testError = null
    },
    clearCache(state) {
      Object.assign(state, initialState)
    },
  },
})

export const sendReducer = sendSlice.reducer
export const sendActions = sendSlice.actions

const sendSmsEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.sendSmsRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof sendActions.sendSmsRequested>).payload
      return from(smsApi.sendSms(body)).pipe(
        map((response) => sendActions.sendSmsSucceeded({ queueId: response.queueId })),
        catchError((err: Error) => of(sendActions.sendSmsFailed(err.message))),
      )
    }),
  )

const sendTestSmsEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.sendTestSmsRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof sendActions.sendTestSmsRequested>).payload
      return from(smsApi.sendTestSms(body)).pipe(
        map(() => sendActions.sendTestSmsSucceeded()),
        catchError((err: Error) => of(sendActions.sendTestSmsFailed(err.message))),
      )
    }),
  )

const previewEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.previewRequested.type),
    exhaustMap((action) => {
      const { id, payload } = (action as ReturnType<typeof sendActions.previewRequested>).payload
      return from(smsApi.previewTemplate(id, payload)).pipe(
        map((result) => sendActions.previewSucceeded(result)),
        catchError((err: Error) => of(sendActions.previewFailed(err.message))),
      )
    }),
  )

export const sendEpics = combineEpics(sendSmsEpic, sendTestSmsEpic, previewEpic)
