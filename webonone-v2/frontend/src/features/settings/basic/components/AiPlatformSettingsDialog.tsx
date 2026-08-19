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
  Textarea,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  isUnchangedSavedApiKey,
  platformAiSettingsFormSchema,
  type PlatformAiSettingsFormValues,
} from '@/features/settings/basic/schemas/aiSettingsSchemas'
import type { AiSettingsResponse } from '@/features/settings/basic/services/aiSettingsApi'
import { aiSettingsActions } from '@/features/settings/basic/store/aiSettingsSlice'

const PLATFORM_FORM_ID = 'ai-platform-settings-form'

const PLATFORM_DEFAULTS: PlatformAiSettingsFormValues = {
  provider: 'ollama',
  model: 'llama3.1',
  baseUrl: 'http://127.0.0.1:11434',
  timeoutMs: 60_000,
  extraSystemPrompt: '',
}

type AiPlatformSettingsDialogProps = {
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

export function AiPlatformSettingsDialog({
  open,
  settings,
  onOpenChange,
}: AiPlatformSettingsDialogProps) {
  const { t } = useTranslation('settings')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((s) => s.aiSettings)
  const wasSaving = useRef(false)

  const [form, setForm] = useState<PlatformAiSettingsFormValues>(PLATFORM_DEFAULTS)
  const [apiKey, setApiKey] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})
  const saving = status === 'saving'

  useEffect(() => {
    if (!open) {
      wasSaving.current = false
      return
    }
    if (wasSaving.current) return
    setForm({
      provider: settings?.provider ?? PLATFORM_DEFAULTS.provider,
      model: settings?.model ?? PLATFORM_DEFAULTS.model,
      baseUrl: settings?.baseUrl ?? PLATFORM_DEFAULTS.baseUrl,
      timeoutMs: settings?.timeoutMs ?? PLATFORM_DEFAULTS.timeoutMs,
      extraSystemPrompt: settings?.extraSystemPrompt ?? '',
    })
    setApiKey(settings?.apiKey ?? '')
    setFieldErrors({})
  }, [open, settings])

  useEffect(() => {
    if (!open || !wasSaving.current) return
    if (status === 'idle' && !error) {
      toast({ title: t('ai.platform.toast.saved') })
      wasSaving.current = false
      onOpenChange(false)
    }
    if (status === 'error' && error) {
      toast({ title: t('ai.platform.toast.saveFailed'), description: error, variant: 'destructive' })
      wasSaving.current = false
    }
  }, [status, error, open, toast, t, onOpenChange])

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const keepExistingKey = isUnchangedSavedApiKey(apiKey, settings)
    const nextApiKey = keepExistingKey ? undefined : apiKey.trim() || undefined
    const parsed = platformAiSettingsFormSchema.safeParse({
      ...form,
      apiKey: nextApiKey,
    })
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromIssues(parsed.error.issues))
      return
    }
    setFieldErrors({})
    wasSaving.current = true
    dispatch(aiSettingsActions.patchPlatformSettingsRequested(parsed.data))
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('ai.platform.editTitle')}
      description={t('ai.platform.description')}
      sizeWidth="small"
      sizeHeight="large"
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
          <Button type="submit" form={PLATFORM_FORM_ID} className="h-10" disabled={saving}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {t('ai.platform.save')}
          </Button>
        </>
      }
    >
      {error && status === 'error' ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form id={PLATFORM_FORM_ID} onSubmit={handleSubmit}>
        <FormField label={t('ai.fields.model')} htmlFor="ai-platform-model" error={fieldErrors.model} required>
          <Input
            id="ai-platform-model"
            value={form.model}
            onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
          />
        </FormField>
        <FormField
          label={t('ai.fields.baseUrl')}
          htmlFor="ai-platform-base-url"
          error={fieldErrors.baseUrl}
          required
        >
          <Input
            id="ai-platform-base-url"
            value={form.baseUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))}
          />
        </FormField>
        <FormField label={t('ai.fields.apiKey')} htmlFor="ai-platform-api-key" error={fieldErrors.apiKey}>
          <PasswordInput
            id="ai-platform-api-key"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              settings?.hasApiKey
                ? t('ai.fields.apiKeyPlaceholderSaved')
                : t('ai.fields.apiKeyPlaceholderOptional')
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
        <FormField label={t('ai.fields.timeoutMs')} htmlFor="ai-platform-timeout" error={fieldErrors.timeoutMs}>
          <Input
            id="ai-platform-timeout"
            type="number"
            min={1000}
            max={600000}
            value={form.timeoutMs}
            onChange={(event) => setForm((prev) => ({ ...prev, timeoutMs: Number(event.target.value) }))}
          />
        </FormField>
        <FormField
          label={t('ai.platform.extraPrompt')}
          htmlFor="ai-platform-extra-prompt"
          error={fieldErrors.extraSystemPrompt}
        >
          <p className="mb-2 text-sm text-muted-foreground">{t('ai.platform.extraPromptDescription')}</p>
          <Textarea
            id="ai-platform-extra-prompt"
            rows={4}
            value={form.extraSystemPrompt ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, extraSystemPrompt: event.target.value }))}
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
