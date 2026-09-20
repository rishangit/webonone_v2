import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Button, Muted, OtpInput } from '@webonone/mobile-ui'
import { ApiError } from '@/shared/services/apiClient'
import { authApi } from '../authApi'
import {
  mapZodIssuesToFieldErrors,
  verifyRegisterOtpSchema,
  type VerifyRegisterOtpFormValues,
} from '../schemas/authSchemas'
import { saveRegistrationSessionToken } from '../utils/authFlowStorage'
import { maskEmail } from '../utils/maskEmail'

const OTP_COUNTDOWN_SECONDS = 120

type RegisterVerifyOtpStepProps = {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function RegisterVerifyOtpStep({ email, onSuccess, onBack }: RegisterVerifyOtpStepProps) {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState<VerifyRegisterOtpFormValues>({ otp: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VerifyRegisterOtpFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_COUNTDOWN_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  const expired = secondsLeft <= 0
  const disabled = loading || locked || expired

  async function handleSubmit() {
    if (disabled) return

    const parsed = verifyRegisterOtpSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const result = await authApi.verifyRegisterEmailOtp(email, parsed.data.otp)
      await saveRegistrationSessionToken(result.registrationSessionToken)
      onSuccess()
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

  return (
    <View className="gap-4">
      <Muted className="text-center">{t('codeSentTo', { email: maskEmail(email) })}</Muted>
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
            <Pressable accessibilityRole="button" onPress={onBack}>
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
        {t('verifyEmail')}
      </Button>
    </View>
  )
}
