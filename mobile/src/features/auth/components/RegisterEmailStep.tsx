import { useState } from 'react'
import { View } from 'react-native'
import { Mail } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Button, TextField } from '@webonone/mobile-ui'
import { ApiError } from '@/shared/services/apiClient'
import { authApi } from '../authApi'
import {
  mapZodIssuesToFieldErrors,
  registerEmailSchema,
  type RegisterEmailFormValues,
} from '../schemas/authSchemas'
import { saveRegistrationEmail } from '../utils/authFlowStorage'

type RegisterEmailStepProps = {
  onSuccess: (email: string) => void
}

export function RegisterEmailStep({ onSuccess }: RegisterEmailStepProps) {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState<RegisterEmailFormValues>({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterEmailFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const parsed = registerEmailSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const email = parsed.data.email.trim().toLowerCase()
      await authApi.requestRegisterEmailOtp(email)
      await saveRegistrationEmail(email)
      onSuccess(email)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_EXISTS') {
        setError(t('emailAlreadyRegistered'))
      } else {
        setError(err instanceof Error ? err.message : t('errors.sendCodeFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <TextField
        label={t('email')}
        required
        leadingIcon={Mail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={values.email}
        onChangeText={(email) => setValues({ email })}
        error={fieldErrors.email ? t(fieldErrors.email) : undefined}
      />
      <Button className="w-full" loading={loading} disabled={loading} onPress={handleSubmit}>
        {t('sendVerificationCode')}
      </Button>
    </View>
  )
}
