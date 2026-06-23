import { useState } from 'react'
import { Mail } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  Input,
  InputGroup,
  InputGroupIcon,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/authSchemas'
import { authActions } from '../store'

export function ForgotPasswordForm() {
  const dispatch = useAppDispatch()
  const { isLoading, error, forgotPasswordResetToken } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<ForgotPasswordFormValues>({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ForgotPasswordFormValues, string>>>({})
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = forgotPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setSubmitted(false)
    dispatch(authActions.clearAuthError())
    dispatch(authActions.forgotPasswordRequested(parsed.data))
    setSubmitted(true)
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {submitted && !error ? (
        <Alert>
          <AlertDescription>
            If the email exists, a reset link has been sent.
            {forgotPasswordResetToken ? (
              <span className="mt-2 block break-all text-xs">
                Dev reset token: {forgotPasswordResetToken}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
        <InputGroup>
          <InputGroupIcon icon={Mail} />
          <Input
            id="email"
            inGroup
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues({ email: e.target.value })}
          />
        </InputGroup>
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Send reset link'}
      </Button>
    </Form>
  )
}
