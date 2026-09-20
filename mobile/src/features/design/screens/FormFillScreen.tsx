import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  FeatureScreen,
  Label,
  NativeSelect,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  Textarea,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { useDesignPermissions } from '@/features/design/hooks/useDesignPermissions'
import { formsListPath } from '@/features/design/utils/designPaths'
import { designAdminApi } from '@/shared/services/designAdminApi'
import type { FormField as FormFieldDef, FormTemplate } from '@/shared/types/design.types'

type FormFillMode = 'fill' | 'view' | 'edit'

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function parseMode(mode: string): FormFillMode {
  if (mode === 'view') return 'view'
  if (mode === 'edit') return 'edit'
  return 'fill'
}

export function FormFillScreen({ formId }: { formId: string }) {
  const { t } = useTranslation('forms')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const { toast } = useToast()
  const { hasCompany, userId } = useDesignPermissions()
  const params = useLocalSearchParams()

  const subjectUserId = firstParam(params.subjectUserId)
  const subjectDisplayName = firstParam(params.subjectDisplayName) || t('customerFallback')
  const serviceId = firstParam(params.serviceId)
  const serviceName = firstParam(params.serviceName)
  const eventId = firstParam(params.eventId)
  const occurrenceDate = firstParam(params.occurrenceDate)
  const sessionTokenId = firstParam(params.sessionTokenId)
  const submissionId = firstParam(params.submissionId)
  const mode = parseMode(firstParam(params.mode))
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isReadOnly = isView

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canFill = !isReadOnly && hasCompany && Boolean(subjectUserId) && subjectUserId !== userId

  useEffect(() => {
    if (!formId || !hasCompany) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const load = async () => {
      const loaded = await designAdminApi.getForm(formId)
      if (cancelled) return
      setForm(loaded)
      const initial: Record<string, unknown> = {}
      for (const field of loaded.definition.fields) {
        initial[field.id] = field.type === 'checkbox' ? false : ''
      }
      if ((isView || isEdit) && submissionId) {
        const submission = await designAdminApi.getSubmission(submissionId)
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
  }, [formId, hasCompany, isEdit, isView, submissionId, t])

  const fields = useMemo(() => form?.definition.fields ?? [], [form])

  function goBack() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace(formsListPath())
  }

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
    if (isReadOnly || !form || !formId) return
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
      await designAdminApi.createSubmission({
        formTemplateId: formId,
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
      goBack()
    } catch (err) {
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

  if (!subjectUserId) {
    return (
      <FeatureScreen title={t('fill')} description={t('customerRequired')} onBack={goBack} backLabel={tc('back')}>
        <Alert variant="destructive">
          <AlertDescription>{t('missingSubject')}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (loading && !form) {
    return (
      <FeatureScreen
        title={isView || isEdit ? t('viewForm') : t('fill')}
        description={t('loadingForm')}
        onBack={goBack}
        backLabel={tc('back')}
      >
        <Spinner label={t('loadingForm')} />
      </FeatureScreen>
    )
  }

  if (error && !form) {
    return (
      <FeatureScreen
        title={isView || isEdit ? t('viewForm') : t('fill')}
        description={t('unableToLoad')}
        onBack={goBack}
        backLabel={tc('back')}
      >
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </FeatureScreen>
    )
  }

  if (!form) {
    return null
  }

  const pageTitle =
    isView || isEdit ? t('viewNamed', { name: form.name }) : t('fillNamed', { name: form.name })

  return (
    <FeatureScreen
      title={pageTitle}
      description={
        serviceName
          ? t('forSubjectService', { name: subjectDisplayName, service: serviceName })
          : t('forSubject', { name: subjectDisplayName })
      }
      onBack={goBack}
      backLabel={tc('back')}
      actions={
        <View className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" onPress={goBack}>
            {isView ? tc('close') : tc('cancel')}
          </Button>
          {!isView ? (
            <Button size="sm" disabled={submitting || !canFill} onPress={() => void handleSubmit()}>
              {submitting ? (isEdit ? t('saving') : t('submitting')) : isEdit ? tc('save') : tc('submit')}
            </Button>
          ) : null}
        </View>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <View className="w-full gap-6">
        {fields.map((field) => {
          if (field.type === 'checkbox') {
            return (
              <View key={field.id} className="flex-row items-start gap-3">
                <Checkbox
                  checked={Boolean(answers[field.id])}
                  disabled={isReadOnly}
                  onCheckedChange={(checked) => setAnswer(field.id, checked)}
                />
                <Label required={field.required}>{field.label}</Label>
              </View>
            )
          }

          if (field.type === 'textarea') {
            return (
              <Textarea
                key={field.id}
                label={field.label}
                required={field.required}
                error={fieldErrors[field.id]}
                value={String(answers[field.id] ?? '')}
                placeholder={field.placeholder}
                editable={!isReadOnly}
                onChangeText={(value) => setAnswer(field.id, value)}
                numberOfLines={4}
              />
            )
          }

          if (field.type === 'select') {
            return (
              <NativeSelect
                key={field.id}
                label={field.label}
                required={field.required}
                error={fieldErrors[field.id]}
                value={String(answers[field.id] ?? '')}
                onValueChange={(value) => setAnswer(field.id, value)}
                disabled={isReadOnly}
                placeholder={field.placeholder || t('selectPlaceholder')}
                options={(field.options ?? []).map((opt) => ({
                  value: opt.id,
                  label: opt.label,
                }))}
              />
            )
          }

          if (field.type === 'radio') {
            return (
              <View key={field.id} className="gap-2">
                <Label required={field.required}>{field.label}</Label>
                <RadioGroup
                  value={String(answers[field.id] ?? '')}
                  onValueChange={(value) => setAnswer(field.id, value)}
                  disabled={isReadOnly}
                >
                  {(field.options ?? []).map((opt) => (
                    <RadioGroupItem
                      key={opt.id}
                      value={opt.id}
                      label={opt.label}
                      disabled={isReadOnly}
                    />
                  ))}
                </RadioGroup>
                {fieldErrors[field.id] ? (
                  <Alert variant="destructive">
                    <AlertDescription>{fieldErrors[field.id]}</AlertDescription>
                  </Alert>
                ) : null}
              </View>
            )
          }

          return (
            <TextField
              key={field.id}
              label={field.label}
              required={field.required}
              error={fieldErrors[field.id]}
              value={String(answers[field.id] ?? '')}
              placeholder={field.placeholder}
              editable={!isReadOnly}
              onChangeText={(value) => setAnswer(field.id, value)}
            />
          )
        })}

        {fields.length === 0 ? (
          <Alert>
            <AlertDescription>{t('noFields')}</AlertDescription>
          </Alert>
        ) : null}
      </View>
    </FeatureScreen>
  )
}
