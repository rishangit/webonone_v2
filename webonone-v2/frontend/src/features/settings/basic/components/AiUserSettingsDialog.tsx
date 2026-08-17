import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Form,
  FormField,
  Input,
  PasswordInput,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  OLLAMA_CLOUD_DEFAULTS,
  isUnchangedSavedApiKey,
  userAiSettingsFormSchema,
  type UserAiSettingsFormValues,
} from '@/features/settings/basic/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'
import { aiSettingsActions } from '@/features/settings/basic/store/aiSettingsSlice'

const USER_FORM_ID = 'ai-user-settings-form'

type AiUserSettingsDialogProps = {
  open: boolean
  settings: AiSettingsResponse | null
  onOpenChange: (open: boolean) => void
}

function fieldErrorsFromIssues(issues: { path: PropertyKey[]; message: string }[]) {
  return mapZodIssuesToFieldErrors(
    issues.map((issue) => ({
      path: issue.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number'),
      message: issue.message,
    })),
  )
}

export function AiUserSettingsDialog({ open, settings, onOpenChange }: AiUserSettingsDialogProps) {
  const { t } = useTranslation('settings')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((s) => s.aiSettings)
  const wasSaving = useRef(false)

  const [form, setForm] = useState<UserAiSettingsFormValues>(OLLAMA_CLOUD_DEFAULTS)
  const [apiKey, setApiKey] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})

  const configured = settings?.configured ?? false
  const saving = status === 'saving'

  useEffect(() => {
    if (!open) return
    setForm({
      provider: settings?.provider ?? OLLAMA_CLOUD_DEFAULTS.provider,
      model: settings?.model ?? OLLAMA_CLOUD_DEFAULTS.model,
      baseUrl: settings?.baseUrl ?? OLLAMA_CLOUD_DEFAULTS.baseUrl,
      timeoutMs: settings?.timeoutMs ?? OLLAMA_CLOUD_DEFAULTS.timeoutMs,
    })
    setApiKey(settings?.apiKey ?? '')
    setFieldErrors({})
    wasSaving.current = false
  }, [open, settings])

  useEffect(() => {
    if (!open || !wasSaving.current) return
    if (status === 'idle' && !error) {
      toast({ title: t('ai.toast.saved') })
      wasSaving.current = false
      onOpenChange(false)
    }
    if (status === 'error' && error) {
      toast({ title: t('ai.toast.saveFailed'), description: error, variant: 'destructive' })
      wasSaving.current = false
    }
  }, [status, error, open, toast, t, onOpenChange])

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const keepExistingKey = isUnchangedSavedApiKey(apiKey, settings)
    const nextApiKey = keepExistingKey ? undefined : apiKey.trim() || undefined
    const parsed = userAiSettingsFormSchema.safeParse({
      ...form,
      apiKey: nextApiKey,
    })
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromIssues(parsed.error.issues))
      return
    }
    if (!configured && !nextApiKey) {
      setFieldErrors({ apiKey: t('ai.fields.apiKeyRequired') })
      return
    }
    setFieldErrors({})
    wasSaving.current = true
    dispatch(aiSettingsActions.patchUserSettingsRequested(parsed.data))
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('ai.editTitle')}
      description={t('ai.description')}
      sizeWidth="small"
      sizeHeight="auto"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('ai.cancel')}
          </Button>
          <Button type="submit" form={USER_FORM_ID} className="h-10" disabled={saving}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {configured ? t('ai.save') : t('ai.saveAndEnable')}
          </Button>
        </>
      }
    >
      {error && status === 'error' ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form id={USER_FORM_ID} onSubmit={handleSubmit}>
        <FormField
          label={t('ai.fields.apiKey')}
          htmlFor="ai-user-api-key"
          error={fieldErrors.apiKey}
          required={!configured}
        >
          <PasswordInput
            id="ai-user-api-key"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              configured && settings?.hasApiKey
                ? t('ai.fields.apiKeyPlaceholderSaved')
                : t('ai.fields.apiKeyPlaceholder')
            }
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            onFocus={(event) => {
              if (isUnchangedSavedApiKey(event.target.value, settings)) {
                event.target.select()
              }
            }}
          />
        </FormField>
        <FormField label={t('ai.fields.model')} htmlFor="ai-user-model" error={fieldErrors.model} required>
          <Input
            id="ai-user-model"
            value={form.model}
            onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
          />
        </FormField>
        <FormField label={t('ai.fields.baseUrl')} htmlFor="ai-user-base-url" error={fieldErrors.baseUrl} required>
          <Input
            id="ai-user-base-url"
            value={form.baseUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))}
          />
        </FormField>
        <FormField label={t('ai.fields.timeoutMs')} htmlFor="ai-user-timeout" error={fieldErrors.timeoutMs}>
          <Input
            id="ai-user-timeout"
            type="number"
            min={1000}
            max={600000}
            value={form.timeoutMs}
            onChange={(event) => setForm((prev) => ({ ...prev, timeoutMs: Number(event.target.value) }))}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
