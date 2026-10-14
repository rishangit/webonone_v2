import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Button, FeaturePage, useToast } from '@webonone/ui-kit'
import {
  buildInitialFormAnswers,
  FormFillFields,
  validateFormAnswers,
} from '@/features/forms/components/FormFillFields'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { designApi } from '@/shared/services/designApi'
import type { FormField as FormFieldDef, FormTemplate } from '@/shared/types/design.types'

type FormFillMode = 'fill' | 'view' | 'edit'

function parseMode(mode: string | null): FormFillMode {
  if (mode === 'view') return 'view'
  if (mode === 'edit') return 'edit'
  return 'fill'
}

export function FormFillPage() {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { goToList, isEmbedded } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)

  const subjectUserId = searchParams.get('subjectUserId') ?? ''
  const subjectDisplayName = searchParams.get('subjectDisplayName') ?? t('customerFallback')
  const serviceId = searchParams.get('serviceId')
  const serviceName = searchParams.get('serviceName')
  const eventId = searchParams.get('eventId')
  const occurrenceDate = searchParams.get('occurrenceDate')
  const sessionTokenId = searchParams.get('sessionTokenId')
  const submissionId = searchParams.get('submissionId')
  const mode = parseMode(searchParams.get('mode'))
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isReadOnly = isView

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  usePlatformLoading(loading && !form ? t('loadingForm') : null)

  const canFill =
    !isReadOnly && Boolean(user?.companyId) && Boolean(subjectUserId) && subjectUserId !== user?.id

  useEffect(() => {
    if (!accessToken || !id || !user?.companyId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      const loaded = await designApi.getForm(id)
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
  }, [accessToken, id, isEdit, isView, submissionId, t, user?.companyId])

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

  async function handleSubmit() {
    if (isReadOnly || !form || !id) return
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
        formTemplateId: id,
        subjectUserId,
        serviceId: serviceId || null,
        eventId: eventId || null,
        occurrenceDate: occurrenceDate || null,
        sessionTokenId: sessionTokenId || null,
        answers,
      })
      toast({
        title: isEdit ? t('saved') : t('formSubmitted'),
        description: t('savedFor', { name: subjectDisplayName }),
      })
      if (isEmbedded) {
        goToList()
      } else {
        navigate('/forms')
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

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (!subjectUserId) {
    return (
      <FeaturePage title={t('fill')} description={t('customerRequired')}>
        <Alert variant="destructive">
          <AlertDescription>{t('missingSubject')}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (loading && !form) {
    return null
  }

  if (error && !form) {
    return (
      <FeaturePage
        title={isView || isEdit ? t('viewForm') : t('fill')}
        description={t('unableToLoad')}
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!form) {
    return null
  }

  const pageTitle =
    isView || isEdit ? t('viewNamed', { name: form.name }) : t('fillNamed', { name: form.name })

  return (
    <FeaturePage
      title={pageTitle}
      description={
        serviceName
          ? t('forSubjectService', { name: subjectDisplayName, service: serviceName })
          : t('forSubject', { name: subjectDisplayName })
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goToList}>
            {isView ? tc('close') : tc('cancel')}
          </Button>
          {!isView ? (
            <Button
              type="button"
              size="sm"
              disabled={submitting || !canFill}
              onClick={() => void handleSubmit()}
            >
              {submitting
                ? isEdit
                  ? t('saving')
                  : t('submitting')
                : isEdit
                  ? tc('save')
                  : tc('submit')}
            </Button>
          ) : null}
        </div>
      }
    >
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mx-auto w-full max-w-2xl">
        <FormFillFields
          fields={fields}
          answers={answers}
          fieldErrors={fieldErrors}
          disabled={isReadOnly || submitting}
          onAnswer={setAnswer}
        />
      </div>
    </FeaturePage>
  )
}
