import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  FeaturePage,
  FormField,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
} from '@webonone/ui-kit'
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
      const initial: Record<string, unknown> = {}
      for (const field of loaded.definition.fields) {
        if (field.type === 'checkbox') initial[field.id] = false
        else initial[field.id] = ''
      }
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
    const next: Record<string, string> = {}
    for (const field of fieldsToCheck) {
      const value = answers[field.id]
      if (!field.required) continue
      if (field.type === 'checkbox') continue
      if (value == null || value === '') {
        next[field.id] = t('fieldRequired', { label: field.label })
      }
    }
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

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {fields.map((field) => {
          if (field.type === 'checkbox') {
            return (
              <div key={field.id} className="flex items-start gap-3">
                <Checkbox
                  id={field.id}
                  checked={Boolean(answers[field.id])}
                  disabled={isReadOnly}
                  onCheckedChange={(checked) => setAnswer(field.id, checked === true)}
                />
                <Label htmlFor={field.id} className="font-normal leading-snug">
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
              </div>
            )
          }

          if (field.type === 'textarea') {
            return (
              <FormField
                key={field.id}
                htmlFor={field.id}
                label={field.label}
                required={field.required}
                error={fieldErrors[field.id]}
              >
                <Textarea
                  value={String(answers[field.id] ?? '')}
                  placeholder={field.placeholder}
                  disabled={isReadOnly}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                />
              </FormField>
            )
          }

          if (field.type === 'select') {
            return (
              <FormField
                key={field.id}
                htmlFor={field.id}
                label={field.label}
                required={field.required}
                error={fieldErrors[field.id]}
              >
                <Select
                  value={String(answers[field.id] ?? '') || undefined}
                  onValueChange={(value) => setAnswer(field.id, value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || t('selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )
          }

          if (field.type === 'radio') {
            return (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                <RadioGroup
                  value={String(answers[field.id] ?? '') || undefined}
                  onValueChange={(value) => setAnswer(field.id, value)}
                  disabled={isReadOnly}
                  className="gap-2"
                >
                  {(field.options ?? []).map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={opt.id}
                        id={`${field.id}-${opt.id}`}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`${field.id}-${opt.id}`} className="font-normal">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {fieldErrors[field.id] ? (
                  <p className="text-sm text-destructive">{fieldErrors[field.id]}</p>
                ) : null}
              </div>
            )
          }

          return (
            <FormField
              key={field.id}
              htmlFor={field.id}
              label={field.label}
              required={field.required}
              error={fieldErrors[field.id]}
            >
              <Input
                value={String(answers[field.id] ?? '')}
                placeholder={field.placeholder}
                disabled={isReadOnly}
                onChange={(e) => setAnswer(field.id, e.target.value)}
              />
            </FormField>
          )
        })}

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noFields')}</p>
        ) : null}
      </div>
    </FeaturePage>
  )
}
