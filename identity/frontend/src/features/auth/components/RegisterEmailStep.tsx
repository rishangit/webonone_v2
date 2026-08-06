import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { authApi, type AuthApiError } from '@/shared/services/authApi'
import { saveRegistrationEmail } from '../utils/registrationEmailStorage'

type RegisterEmailStepProps = {
  onSuccess: (email: string) => void
}

export function RegisterEmailStep({ onSuccess }: RegisterEmailStepProps) {
  const { t } = useTranslation('auth')
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
        setError(t('emailAlreadyRegistered'))
      } else {
        setError(apiErr.message ?? t('sendVerificationCode'))
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
      <FormField
        label={t('email')}
        htmlFor="register-email"
        required
        error={fieldErrors.email ? t(fieldErrors.email) : undefined}
      >
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
        {loading ? <Spinner size="sm" /> : t('sendVerificationCode')}
      </Button>
    </Form>
  )
}
