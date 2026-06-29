import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { withRedirectQuery } from '../utils/redirectQuery'
import { saveResetEmail } from '../utils/resetEmailStorage'

export function ForgotPasswordForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<ForgotPasswordFormValues>({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ForgotPasswordFormValues, string>>>({})
  const submittedEmailRef = useRef<string | null>(null)
  const pendingNavigateRef = useRef(false)

  useEffect(() => {
    if (!pendingNavigateRef.current || isLoading || error || !submittedEmailRef.current) {
      return
    }
    pendingNavigateRef.current = false
    const verifyPath = withRedirectQuery(
      `/verify-reset-otp?email=${encodeURIComponent(submittedEmailRef.current)}`,
      searchParams,
    )
    navigate(verifyPath)
  }, [error, isLoading, navigate, searchParams])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = forgotPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    submittedEmailRef.current = parsed.data.email
    saveResetEmail(parsed.data.email)
    pendingNavigateRef.current = true
    dispatch(authActions.clearAuthError())
    dispatch(authActions.forgotPasswordRequested(parsed.data))
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
        {isLoading ? <Spinner size="sm" /> : 'Send verification code'}
      </Button>
    </Form>
  )
}
