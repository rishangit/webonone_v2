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
import { registerEmailSchema, type RegisterEmailFormValues } from '../schemas/authSchemas'
import { authApi, type AuthApiError } from '../services/authApi'
import { saveRegistrationEmail } from '../utils/registrationEmailStorage'

type RegisterEmailStepProps = {
  onSuccess: (email: string) => void
}

export function RegisterEmailStep({ onSuccess }: RegisterEmailStepProps) {
  const [values, setValues] = useState<RegisterEmailFormValues>({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterEmailFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = registerEmailSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      const email = parsed.data.email.trim().toLowerCase()
      await authApi.requestRegisterEmailOtp({ email })
      saveRegistrationEmail(email)
      onSuccess(email)
    } catch (err) {
      const apiErr = err as AuthApiError
      if (apiErr.code === 'EMAIL_EXISTS') {
        setError('This email is already registered. Sign in instead.')
      } else {
        setError(apiErr.message ?? 'Failed to send verification code')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form className="space-y-6" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Email" htmlFor="register-email" required error={fieldErrors.email}>
        <InputGroup>
          <InputGroupIcon icon={Mail} />
          <Input
            id="register-email"
            inGroup
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues({ email: e.target.value })}
          />
        </InputGroup>
      </FormField>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Send verification code'}
      </Button>
    </Form>
  )
}
