import { useEffect, useState } from 'react'
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
import { authApi, type AuthApiError } from '../services/authApi'
import { saveRegistrationSessionToken } from '../utils/registrationSessionStorage'

const OTP_COUNTDOWN_SECONDS = 60

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
        setError('Too many incorrect attempts — request a new code.')
      } else if (typeof apiErr.attemptsRemaining === 'number') {
        setAttemptsRemaining(apiErr.attemptsRemaining)
        setError(apiErr.message)
      } else if (apiErr.code === 'OTP_EXPIRED') {
        setSecondsLeft(0)
        setError('Verification code expired — request a new code.')
      } else {
        setError(apiErr.message ?? 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form className="space-y-6" onSubmit={handleSubmit}>
      <p className="text-center text-sm text-muted-foreground">
        We sent a 4-digit code to {maskEmail(email)}
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!locked && !expired && attemptsRemaining !== null ? (
        <p className="text-center text-sm text-muted-foreground">
          {attemptsRemaining} attempt(s) remaining
        </p>
      ) : null}
      {!locked && !expired ? (
        <p className="text-center text-sm text-muted-foreground">Code expires in {secondsLeft}s</p>
      ) : null}
      {expired && !locked ? (
        <Alert>
          <AlertDescription>
            Code expired.{' '}
            <button type="button" className="underline" onClick={onBack}>
              Request a new code
            </button>
          </AlertDescription>
        </Alert>
      ) : null}
      <FormField label="4-digit code" htmlFor="register-otp" required error={fieldErrors.otp} className="text-center">
        <OtpInput
          id="register-otp"
          length={4}
          value={values.otp}
          disabled={disabled}
          aria-invalid={Boolean(fieldErrors.otp)}
          autoFocus
          className="justify-center"
          onChange={(otp) => setValues({ otp })}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={disabled}>
        {loading ? <Spinner size="sm" /> : 'Verify email'}
      </Button>
    </Form>
  )
}
