import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  AuthLayout,
  Form,
  FormField,
  OtpInput,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { verifyResetOtpSchema, type VerifyResetOtpFormValues } from '../schemas/authSchemas'
import { authApi, type AuthApiError } from '../services/authApi'
import { saveResetSessionToken } from '../utils/resetSessionStorage'
import { clearResetEmail, loadResetEmail } from '../utils/resetEmailStorage'
import { withRedirectQuery } from '../utils/redirectQuery'

const OTP_COUNTDOWN_SECONDS = 60

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] ?? '*' : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}

export function VerifyResetOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const email = (loadResetEmail() ?? decodeURIComponent(emailFromQuery)).trim().toLowerCase()
  const forgotLink = withRedirectQuery('/forgot-password', searchParams)
  const resetPath = withRedirectQuery('/reset-password', searchParams)

  const [values, setValues] = useState<VerifyResetOtpFormValues>({ otp: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VerifyResetOtpFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_COUNTDOWN_SECONDS)

  useEffect(() => {
    if (!email) {
      navigate(forgotLink, { replace: true })
    }
  }, [email, forgotLink, navigate])

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

    const parsed = verifyResetOtpSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const result = await authApi.verifyResetOtp({ email, otp: parsed.data.otp })
      saveResetSessionToken(result.resetSessionToken)
      clearResetEmail()
      navigate(resetPath, {
        replace: true,
        state: { resetSessionToken: result.resetSessionToken },
      })
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

  if (!email) {
    return null
  }

  return (
    <AuthLayout
      title="Enter verification code"
      description={`We sent a 4-digit code to ${maskEmail(email)}`}
      variant="minimal"
      footer={
        <Link to={forgotLink} className="text-primary underline-offset-4 hover:underline">
          Request a new code
        </Link>
      }
    >
      <Form onSubmit={handleSubmit}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {!locked && !expired && attemptsRemaining !== null ? (
          <p className="text-center text-sm text-muted-foreground">{attemptsRemaining} attempt(s) remaining</p>
        ) : null}
        {!locked && !expired ? (
          <p className="text-center text-sm text-muted-foreground">
            Code expires in {secondsLeft}s
          </p>
        ) : null}
        {expired && !locked ? (
          <Alert>
            <AlertDescription>
              Code expired.{' '}
              <Link to={forgotLink} className="underline">
                Request a new code
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
        <FormField label="4-digit code" htmlFor="otp" required error={fieldErrors.otp} className="text-center">
          <OtpInput
            id="otp"
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
          {loading ? <Spinner size="sm" /> : 'Verify code'}
        </Button>
      </Form>
    </AuthLayout>
  )
}
