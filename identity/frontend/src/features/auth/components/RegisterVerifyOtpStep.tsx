import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  OtpInput,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { verifyRegisterOtpSchema, type VerifyRegisterOtpFormValues } from '../schemas/authSchemas'
import { authApi, type AuthApiError } from '@/shared/services/authApi'
import { saveRegistrationSessionToken } from '../utils/registrationSessionStorage'

const OTP_COUNTDOWN_SECONDS = 120

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] ?? '*' : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}

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
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const expired = secondsLeft <= 0
  const disabled = loading || locked || expired

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      const result = await authApi.verifyRegisterEmailOtp({ email, otp: parsed.data.otp })
      saveRegistrationSessionToken(result.registrationSessionToken)
      onSuccess()
    } catch (err) {
      const apiErr = err as AuthApiError
      if (apiErr.code === 'OTP_MAX_ATTEMPTS') {
        setLocked(true)
        setAttemptsRemaining(0)
        setError(t('errors.tooManyAttempts'))
      } else if (typeof apiErr.attemptsRemaining === 'number') {
        setAttemptsRemaining(apiErr.attemptsRemaining)
        setError(apiErr.message)
      } else if (apiErr.code === 'OTP_EXPIRED') {
        setSecondsLeft(0)
        setError(t('errors.codeExpiredRequestNew'))
      } else {
        setError(apiErr.message ?? t('errors.verificationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form className="space-y-6" onSubmit={handleSubmit}>
      <p className="text-center text-sm text-muted-foreground">
        {t('codeSentTo', { email: maskEmail(email) })}
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!locked && !expired && attemptsRemaining !== null ? (
        <p className="text-center text-sm text-muted-foreground">
          {t('attemptsRemaining', { count: attemptsRemaining })}
        </p>
      ) : null}
      {!locked && !expired ? (
        <p className="text-center text-sm text-muted-foreground">
          {t('codeExpiresIn', { seconds: secondsLeft })}
        </p>
      ) : null}
      {expired && !locked ? (
        <Alert>
          <AlertDescription>
            {t('codeExpired')}{' '}
            <button type="button" className="underline" onClick={onBack}>
              {t('requestNewCode')}
            </button>
          </AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label={t('sixDigitCode')}
        htmlFor="register-otp"
        required
        error={fieldErrors.otp ? t(fieldErrors.otp) : undefined}
        className="text-center"
      >
        <OtpInput
          id="register-otp"
          length={6}
          value={values.otp}
          disabled={disabled}
          aria-invalid={Boolean(fieldErrors.otp)}
          autoFocus
          className="justify-center"
          onChange={(otp) => setValues({ otp })}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={disabled}>
        {loading ? <Spinner size="sm" /> : t('verifyEmail')}
      </Button>
    </Form>
  )
}
