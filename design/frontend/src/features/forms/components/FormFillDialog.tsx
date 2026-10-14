import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Spinner,
  useToast,
} from '@webonone/ui-kit'
import {
  buildInitialFormAnswers,
  FormFillFields,
  validateFormAnswers,
} from '@/features/forms/components/FormFillFields'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { designApi } from '@/shared/services/designApi'
import type { FormField as FormFieldDef, FormTemplate } from '@/shared/types/design.types'

export const DESIGN_FORM_FILL_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

export type FormFillMode = 'fill' | 'view' | 'edit'

export type FormFillSubject = {
  formTemplateId: string
  subjectUserId: string
  subjectDisplayName: string
  subjectEmail?: string | null
  serviceId?: string | null
  serviceName?: string | null
  eventId?: string | null
  occurrenceDate?: string | null
  sessionTokenId?: string | null
  mode?: FormFillMode
  submissionId?: string | null
}

type FormFillDialogProps = {
  open: boolean
  subject: FormFillSubject | null
  onOpenChange: (open: boolean) => void
  onSubmitted?: () => void
  chrome?: 'dialog' | 'embed-page'
}

function parseFormFillMode(mode: string | null | undefined): FormFillMode {
  if (mode === 'view') return 'view'
  if (mode === 'edit') return 'edit'
  return 'fill'
}

export function getFormFillCopy(
  t: (key: string, opts?: Record<string, string>) => string,
  subjectDisplayName: string,
  serviceName?: string | null,
  mode: FormFillMode = 'fill',
) {
  const description = serviceName
    ? t('forSubjectService', { name: subjectDisplayName, service: serviceName })
    : t('forSubject', { name: subjectDisplayName })
  if (mode === 'view' || mode === 'edit') {
    return {
      title: t('viewForm'),
      description,
    }
  }
  return {
    title: t('fill'),
    description,
  }
}

export function buildFormFillEmbedPath(subject: FormFillSubject): string {
  const params = new URLSearchParams()
  params.set('subjectUserId', subject.subjectUserId)
  params.set('subjectDisplayName', subject.subjectDisplayName)
  if (subject.subjectEmail) params.set('subjectEmail', subject.subjectEmail)
  if (subject.serviceId) params.set('serviceId', subject.serviceId)
  if (subject.serviceName) params.set('serviceName', subject.serviceName)
  if (subject.eventId) params.set('eventId', subject.eventId)
  if (subject.occurrenceDate) params.set('occurrenceDate', subject.occurrenceDate)
  if (subject.sessionTokenId) params.set('sessionTokenId', subject.sessionTokenId)
  const mode = subject.mode ?? 'fill'
  if (mode === 'view' || mode === 'edit') params.set('mode', mode)
  if (subject.submissionId) params.set('submissionId', subject.submissionId)
  return `/embed/dialogs/forms/${encodeURIComponent(subject.formTemplateId)}/fill?${params.toString()}`
}

export function FormFillDialog({
  open,
  subject,
  onOpenChange,
  onSubmitted,
  chrome = 'dialog',
}: FormFillDialogProps) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)

  const formTemplateId = subject?.formTemplateId ?? ''
  const subjectUserId = subject?.subjectUserId ?? ''
  const subjectDisplayName = subject?.subjectDisplayName ?? t('customerFallback')
  const serviceId = subject?.serviceId ?? null
  const serviceName = subject?.serviceName ?? null
  const eventId = subject?.eventId ?? null
  const occurrenceDate = subject?.occurrenceDate ?? null
  const sessionTokenId = subject?.sessionTokenId ?? null
  const mode: FormFillMode = parseFormFillMode(subject?.mode)
  const submissionId = subject?.submissionId ?? null
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isReadOnly = isView

  const copy = getFormFillCopy(t, subjectDisplayName, serviceName, mode)
  const dialogPath = subject ? buildFormFillEmbedPath(subject) : '/embed/dialogs/forms/fill'
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitLabel = isView ? null : isEdit ? tc('save') : tc('submit')

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open && Boolean(subject),
    path: dialogPath,
    title: copy.title,
    description: copy.description,
    cancelLabel: isView ? tc('close') : tc('cancel'),
    submitLabel,
    ...DESIGN_FORM_FILL_DIALOG_SIZE,
    onResult: () => {
      onOpenChange(false)
      onSubmitted?.()
    },
    onCancel: () => onOpenChange(false),
  })

  const canFill =
    !isReadOnly &&
    Boolean(user?.companyId) &&
    Boolean(subjectUserId) &&
    subjectUserId !== user?.id

  useEffect(() => {
    if ((!open && chrome === 'dialog') || !formTemplateId || !accessToken || !user?.companyId) {
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setForm(null)
    setAnswers({})
    setFieldErrors({})

    const load = async () => {
      const loaded = await designApi.getForm(formTemplateId)
      if (cancelled) return
      setForm(loaded)

      const initial = buildInitialFormAnswers(loaded.definition.fields)

      if ((isView || isEdit) && submissionId) {
        const submission = await designApi.getSubmission(submissionId)
        if (cancelled) return
        setAnswers({ ...initial, ...(submission.answers ?? {}) })
        return
      }

      setAnswers(initial)
    }

    load()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('unableToLoad'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    accessToken,
    chrome,
    formTemplateId,
    isEdit,
    isView,
    open,
    submissionId,
    user?.companyId,
    t,
  ])

  useEffect(() => {
    if (!dialogRequestId || !parentOrigin) return
    sendPlatformPeerDialogBusy(parentOrigin, dialogRequestId, submitting || loading)
  }, [dialogRequestId, loading, parentOrigin, submitting])

  const fields = useMemo(() => form?.definition.fields ?? [], [form])

  function setAnswer(fieldId: string, value: unknown) {
    if (isReadOnly) return
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  function validate(fieldsToCheck: FormFieldDef[]): boolean {
    const next = validateFormAnswers(fieldsToCheck, answers, t)
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    if (isReadOnly || !form || !formTemplateId) return
    if (!canFill) {
      setError(t('cannotFillSelf'))
      return
    }
    if (form.status !== 'published') {
      setError(t('onlyPublished'))
      return
    }
    if (!validate(fields)) return

    setSubmitting(true)
    setError(null)
    try {
      await designApi.createSubmission({
        formTemplateId,
        subjectUserId,
        serviceId,
        eventId,
        occurrenceDate,
        sessionTokenId,
        answers,
      })
      if (dialogRequestId && parentOrigin) {
        sendPlatformPeerDialogComplete(parentOrigin, dialogRequestId)
      } else {
        toast({
          title: isEdit ? t('saved') : t('formSubmitted'),
          description: t('savedFor', { name: subjectDisplayName }),
        })
        onOpenChange(false)
        onSubmitted?.()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('unableToSubmit')
      setError(message)
      toast({
        title: isEdit ? t('saveFailed') : t('submitFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: dialogRequestId && !isReadOnly ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      void submit()
    },
  })

  const body = (
    <div className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!isReadOnly && !canFill && subjectUserId ? (
        <Alert variant="destructive">
          <AlertDescription>
            {t('cannotFillSelf')}
          </AlertDescription>
        </Alert>
      ) : null}
      {loading && !form ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : form ? (
        <>
          <p className="text-sm text-muted-foreground">{form.name}</p>
          <FormFillFields
            fields={fields}
            answers={answers}
            fieldErrors={fieldErrors}
            disabled={isReadOnly || submitting}
            onAnswer={setAnswer}
          />
        </>
      ) : null}
    </div>
  )

  const actions = isView ? (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
      onClick={() => onOpenChange(false)}
    >
      {tc('close')}
    </Button>
  ) : (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => onOpenChange(false)}
        disabled={submitting}
      >
        {tc('cancel')}
      </Button>
      <Button
        type="button"
        className="h-10 px-4"
        onClick={() => void submit()}
        disabled={submitting || loading || !canFill || !form}
      >
        {submitting ? (isEdit ? t('saving') : t('submitting')) : isEdit ? tc('save') : tc('submit')}
      </Button>
    </>
  )

  if (chrome === 'embed-page') {
    return <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
  }

  if (isHosted) {
    return null
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      sizeWidth={DESIGN_FORM_FILL_DIALOG_SIZE.sizeWidth}
      sizeHeight={DESIGN_FORM_FILL_DIALOG_SIZE.sizeHeight}
      footer={actions}
    >
      {body}
    </CustomDialog>
  )
}
