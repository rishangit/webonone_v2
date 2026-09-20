import { useState } from 'react'
import { View } from 'react-native'
import { Mail } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AuthLayout, Button, TextField } from '@webonone/mobile-ui'
import { AuthLink } from './components/AuthLink'
import { authApi } from './authApi'
import {
  forgotPasswordSchema,
  mapZodIssuesToFieldErrors,
  type ForgotPasswordFormValues,
} from './schemas/authSchemas'
import { saveResetEmail } from './utils/authFlowStorage'

export function ForgotPasswordScreen() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const [values, setValues] = useState<ForgotPasswordFormValues>({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ForgotPasswordFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const parsed = forgotPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const email = parsed.data.email.trim().toLowerCase()
      await authApi.forgotPassword(email)
      await saveResetEmail(email)
      router.push('/verify-reset-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.sendCodeFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={t('forgotPasswordTitle')}
      description={t('forgotPasswordDescription')}
      footer={<AuthLink label={t('backToSignIn')} href="/login" />}
    >
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
    </AuthLayout>
  )
}
