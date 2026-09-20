import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AuthLayout, Button, Muted, OtpInput } from '@webonone/mobile-ui'
import { ApiError } from '@/shared/services/apiClient'
import { AuthLink } from './components/AuthLink'
import { authApi } from './authApi'
import {
  mapZodIssuesToFieldErrors,
  verifyResetOtpSchema,
  type VerifyResetOtpFormValues,
} from './schemas/authSchemas'
import { clearResetEmail, loadResetEmail, saveResetSessionToken } from './utils/authFlowStorage'
import { maskEmail } from './utils/maskEmail'

const OTP_COUNTDOWN_SECONDS = 120

export function VerifyResetOtpScreen() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [values, setValues] = useState<VerifyResetOtpFormValues>({ otp: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VerifyResetOtpFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_COUNTDOWN_SECONDS)

  useEffect(() => {
    void loadResetEmail().then((stored) => {
      if (!stored) {
        router.replace('/forgot-password')
        return
      }
      setEmail(stored)
    })
  }, [router])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const expired = secondsLeft <= 0
  const disabled = loading || locked || expired || !email

  async function handleSubmit() {
    if (disabled || !email) return

    const parsed = verifyResetOtpSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const result = await authApi.verifyResetOtp(email, parsed.data.otp)
      await saveResetSessionToken(result.resetSessionToken)
      await clearResetEmail()
      router.replace('/reset-password')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'OTP_MAX_ATTEMPTS') {
          setLocked(true)
          setAttemptsRemaining(0)
          setError(t('errors.tooManyAttempts'))
        } else if (typeof err.attemptsRemaining === 'number') {
          setAttemptsRemaining(err.attemptsRemaining)
          setError(err.message)
        } else if (err.code === 'OTP_EXPIRED') {
          setSecondsLeft(0)
          setError(t('errors.codeExpiredRequestNew'))
        } else {
          setError(err.message ?? t('errors.verificationFailed'))
        }
      } else {
        setError(err instanceof Error ? err.message : t('errors.verificationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <AuthLayout
      title={t('enterVerificationCode')}
      description={t('codeSentTo', { email: maskEmail(email) })}
      footer={<AuthLink label={t('requestNewCode')} href="/forgot-password" />}
    >
      <View className="gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {!locked && !expired && attemptsRemaining !== null ? (
          <Muted className="text-center">{t('attemptsRemaining', { count: attemptsRemaining })}</Muted>
        ) : null}
        {!locked && !expired ? (
          <Muted className="text-center">{t('codeExpiresIn', { seconds: secondsLeft })}</Muted>
        ) : null}
        {expired && !locked ? (
          <Alert>
            <AlertDescription>
              {t('codeExpired')}{' '}
              <Pressable accessibilityRole="link" onPress={() => router.replace('/forgot-password')}>
                <Text className="text-sm text-primary underline">{t('requestNewCode')}</Text>
              </Pressable>
            </AlertDescription>
          </Alert>
        ) : null}
        <OtpInput
          label={t('sixDigitCode')}
          required
          value={values.otp}
          disabled={disabled}
          onChange={(otp) => setValues({ otp })}
          error={fieldErrors.otp ? t(fieldErrors.otp) : undefined}
        />
        <Button className="w-full" loading={loading} disabled={disabled} onPress={handleSubmit}>
          {t('verifyCode')}
        </Button>
      </View>
    </AuthLayout>
  )
}
