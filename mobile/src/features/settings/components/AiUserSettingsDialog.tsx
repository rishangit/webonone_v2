import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  FormField,
  NativeSelect,
  PasswordInput,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import {
  AI_PROVIDER_OPTIONS,
  OLLAMA_CLOUD_DEFAULTS,
  defaultsForProvider,
  isUnchangedSavedApiKey,
  mapZodIssuesToFieldErrors,
  userAiSettingsFormSchema,
  type UserAiSettingsFormValues,
} from '@/features/settings/schemas/aiSettingsSchemas'
import { aiSettingsApi, type AiSettingsResponse } from '@/features/settings/services/aiSettingsApi'

type AiUserSettingsDialogProps = {
  open: boolean
  settings: AiSettingsResponse | null
  onOpenChange: (open: boolean) => void
  onSaved: (settings: AiSettingsResponse) => void
}

export function AiUserSettingsDialog({
  open,
  settings,
  onOpenChange,
  onSaved,
}: AiUserSettingsDialogProps) {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const configured = settings?.configured ?? false
  const [form, setForm] = useState<UserAiSettingsFormValues>(OLLAMA_CLOUD_DEFAULTS)
  const [apiKey, setApiKey] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    setSaving(false)
  }, [open, settings])

  async function handleSubmit() {
    const keepExistingKey = isUnchangedSavedApiKey(apiKey, settings)
    const nextApiKey = keepExistingKey ? undefined : apiKey.trim() || undefined
    const parsed = userAiSettingsFormSchema.safeParse({
      ...form,
      apiKey: nextApiKey,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    if (!configured && !nextApiKey) {
      setFieldErrors({ apiKey: t('ai.fields.apiKeyRequired') })
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)
    try {
      const saved = await aiSettingsApi.patchMine({
        ...parsed.data,
        apiKey: nextApiKey,
      })
      toast({ title: t('ai.toast.saved') })
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('ai.toast.saveFailed')
      setError(message)
      toast({ title: t('ai.toast.saveFailed'), description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const providerOptions = AI_PROVIDER_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }))

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('ai.editTitle')}
      description={t('ai.description')}
      sizeWidth="medium"
      sizeHeight="large"
      footer={
        <View className="flex-row flex-wrap justify-end gap-2">
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={saving}>
            {t('ai.cancel')}
          </Button>
          <Button onPress={() => void handleSubmit()} disabled={saving}>
            {configured ? t('ai.save') : t('ai.saveAndEnable')}
          </Button>
        </View>
      }
    >
      <View className="gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <FormField label={t('ai.fields.provider')} required>
          <NativeSelect
            value={form.provider}
            options={providerOptions}
            allowEmpty={false}
            onValueChange={(value) => {
              const provider = value as UserAiSettingsFormValues['provider']
              if (provider !== 'ollama' && provider !== 'openai') return
              setForm((prev) => {
                const defaults = defaultsForProvider(provider)
                return {
                  ...prev,
                  provider,
                  model: defaults.model,
                  baseUrl: defaults.baseUrl,
                }
              })
            }}
          />
        </FormField>

        <FormField
          label={form.provider === 'openai' ? t('ai.fields.apiKeyOpenAi') : t('ai.fields.apiKey')}
          required={!configured || form.provider === 'openai'}
          error={fieldErrors.apiKey}
        >
          <PasswordInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={
              configured && settings?.hasApiKey
                ? t('ai.fields.apiKeyPlaceholderSaved')
                : form.provider === 'openai'
                  ? t('ai.fields.apiKeyPlaceholderOpenAi')
                  : t('ai.fields.apiKeyPlaceholder')
            }
          />
        </FormField>

        <TextField
          label={t('ai.fields.model')}
          required
          value={form.model}
          onChangeText={(text) => setForm((prev) => ({ ...prev, model: text }))}
          error={fieldErrors.model}
        />

        <TextField
          label={t('ai.fields.baseUrl')}
          required
          value={form.baseUrl}
          onChangeText={(text) => setForm((prev) => ({ ...prev, baseUrl: text }))}
          error={fieldErrors.baseUrl}
        />

        <TextField
          label={t('ai.fields.timeoutMs')}
          value={String(form.timeoutMs)}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, timeoutMs: Number(text) || prev.timeoutMs }))
          }
          error={fieldErrors.timeoutMs}
          keyboardType="numeric"
        />
      </View>
    </CustomDialog>
  )
}
