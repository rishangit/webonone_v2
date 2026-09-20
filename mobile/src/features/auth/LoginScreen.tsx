import { useState } from 'react'
import { View } from 'react-native'
import { Mail } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  AuthLayout,
  Button,
  Heading,
  Muted,
  PasswordInput,
  TextField,
} from '@webonone/mobile-ui'
import { AuthDivider } from './components/AuthDivider'
import { AuthLink } from './components/AuthLink'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { useSession } from './SessionContext'
import { isGoogleSignInAvailable } from './googleSignIn'
import { loginSchema, mapZodIssuesToFieldErrors, type LoginFormValues } from './schemas/authSchemas'

export function LoginScreen() {
  const { t } = useTranslation('auth')
  const { login, loginWithGoogle } = useSession()
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const showGoogle = isGoogleSignInAvailable()
  const year = new Date().getFullYear()

  async function handleSubmit() {
    const result = loginSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues) as Partial<
        Record<keyof LoginFormValues, string>
      >)
      return
    }
    setFieldErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await login(result.data.email, result.data.password)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('errors.verificationFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setFormError(null)
    setGoogleSubmitting(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('googleSignInFailed'))
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const busy = submitting || googleSubmitting

  const authFooter = <AuthLink label={t('forgotPasswordLink')} href="/forgot-password" />

  return (
    <View className="w-full">
      <Heading className="pt-2 text-center font-semibold tracking-tight">{t('welcomeBack')}</Heading>

      <View className="mt-6">
        <AuthLayout title={t('signIn')} description={t('signInDescription')} footer={authFooter}>
          <View className="gap-4">
            {showGoogle ? (
              <GoogleSignInButton loading={googleSubmitting} disabled={busy} onPress={handleGoogle} />
            ) : null}

            {showGoogle ? <AuthDivider label={t('orContinueWithEmail')} /> : null}

            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
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
              onChangeText={(email) => setValues((prev) => ({ ...prev, email }))}
              error={fieldErrors.email ? t(fieldErrors.email) : undefined}
            />
            <PasswordInput
              label={t('password')}
              required
              withIcon
              autoComplete="password"
              value={values.password}
              onChangeText={(password) => setValues((prev) => ({ ...prev, password }))}
              error={fieldErrors.password ? t(fieldErrors.password) : undefined}
            />
            <Button className="w-full" loading={submitting} disabled={busy} onPress={handleSubmit}>
              {t('signIn')}
            </Button>
          </View>
        </AuthLayout>
      </View>

      <View className="mt-6 items-center gap-2 pb-2">
        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Muted>{t('noAccount')}</Muted>
          <AuthLink label={t('createAccount')} href="/register" />
        </View>
        <Muted>{t('copyright', { year })}</Muted>
      </View>
    </View>
  )
}
