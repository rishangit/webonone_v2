import { useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Button, PasswordInput } from '@webonone/mobile-ui'
import { authApi } from '../authApi'
import {
  mapZodIssuesToFieldErrors,
  registerPasswordSchema,
  type RegisterPasswordFormValues,
} from '../schemas/authSchemas'
import { loadRegistrationSessionToken } from '../utils/authFlowStorage'

type RegisterPasswordStepProps = {
  firstName: string
  lastName: string
  onBack: () => void
  onSuccess: () => void
}

export function RegisterPasswordStep({ firstName, lastName, onBack, onSuccess }: RegisterPasswordStepProps) {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState<RegisterPasswordFormValues>({
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterPasswordFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const parsed = registerPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    const registrationSessionToken = await loadRegistrationSessionToken()
    if (!registrationSessionToken) {
      setFieldErrors({ password: t('errors.registrationSessionExpired') })
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      await authApi.completeRegistration({
        registrationSessionToken,
        firstName,
        lastName,
        password: parsed.data.password,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.verificationFailed'))
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
      <PasswordInput
        label={t('password')}
        required
        withIcon
        autoComplete="new-password"
        value={values.password}
        onChangeText={(password) => setValues((prev) => ({ ...prev, password }))}
        error={fieldErrors.password ? t(fieldErrors.password) : undefined}
      />
      <PasswordInput
        label={t('confirmPassword')}
        required
        withIcon
        autoComplete="new-password"
        value={values.confirmPassword}
        onChangeText={(confirmPassword) => setValues((prev) => ({ ...prev, confirmPassword }))}
        error={fieldErrors.confirmPassword ? t(fieldErrors.confirmPassword) : undefined}
      />
      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1" disabled={loading} onPress={onBack}>
          {t('back')}
        </Button>
        <Button className="flex-1" loading={loading} disabled={loading} onPress={handleSubmit}>
          {t('createAccount')}
        </Button>
      </View>
    </View>
  )
}
