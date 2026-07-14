import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { combineEpics, ofType, type Epic } from 'redux-observable'
import { from, of } from 'rxjs'
import { catchError, exhaustMap, map } from 'rxjs/operators'
import { emailApi, type SendEmailBody, type TestEmailBody } from '@/shared/services/emailApi'
import type { TemplatePreviewResult } from '@/shared/types/email.types'

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
    sendEmailRequested(state, _action: PayloadAction<SendEmailBody>) {
      state.sendStatus = 'sending'
      state.sendError = null
      state.sendSuccess = null
    },
    sendEmailSucceeded(state, action: PayloadAction<{ queueId: string }>) {
      state.sendStatus = 'idle'
      state.sendSuccess = `Email queued (${action.payload.queueId}).`
      state.preview = null
    },
    sendEmailFailed(state, action: PayloadAction<string>) {
      state.sendStatus = 'error'
      state.sendError = action.payload
    },
    sendTestEmailRequested(state, _action: PayloadAction<TestEmailBody>) {
      state.testStatus = 'sending'
      state.testError = null
    },
    sendTestEmailSucceeded(state) {
      state.testStatus = 'idle'
    },
    sendTestEmailFailed(state, action: PayloadAction<string>) {
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

const sendEmailEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.sendEmailRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof sendActions.sendEmailRequested>).payload
      return from(emailApi.sendEmail(body)).pipe(
        map((response) => sendActions.sendEmailSucceeded({ queueId: response.queueId })),
        catchError((err: Error) => of(sendActions.sendEmailFailed(err.message))),
      )
    }),
  )

const sendTestEmailEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.sendTestEmailRequested.type),
    exhaustMap((action) => {
      const body = (action as ReturnType<typeof sendActions.sendTestEmailRequested>).payload
      return from(emailApi.sendTestEmail(body)).pipe(
        map(() => sendActions.sendTestEmailSucceeded()),
        catchError((err: Error) => of(sendActions.sendTestEmailFailed(err.message))),
      )
    }),
  )

const previewEpic: Epic = (action$) =>
  action$.pipe(
    ofType(sendActions.previewRequested.type),
    exhaustMap((action) => {
      const { id, payload } = (action as ReturnType<typeof sendActions.previewRequested>).payload
      return from(emailApi.previewTemplate(id, payload)).pipe(
        map((result) => sendActions.previewSucceeded(result)),
        catchError((err: Error) => of(sendActions.previewFailed(err.message))),
      )
    }),
  )

export const sendEpics = combineEpics(sendEmailEpic, sendTestEmailEpic, previewEpic)
