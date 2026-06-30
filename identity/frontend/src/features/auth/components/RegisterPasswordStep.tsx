import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  PasswordInput,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { registerPasswordSchema, type RegisterPasswordFormValues } from '../schemas/authSchemas'
import { authActions } from '../store'
import { loadRegistrationSessionToken } from '../utils/registrationSessionStorage'

type RegisterPasswordStepProps = {
  firstName: string
  lastName: string
  onBack: () => void
}

export function RegisterPasswordStep({ firstName, lastName, onBack }: RegisterPasswordStepProps) {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<RegisterPasswordFormValues>({
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterPasswordFormValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = registerPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    const registrationSessionToken = loadRegistrationSessionToken()
    if (!registrationSessionToken) {
      setFieldErrors({ password: 'Registration session expired. Start again.' })
      return
    }

    setFieldErrors({})
    dispatch(authActions.clearAuthError())
    dispatch(
      authActions.registerRequested({
        registrationSessionToken,
        firstName,
        lastName,
        password: parsed.data.password,
      }),
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Password" htmlFor="register-password" required error={fieldErrors.password}>
        <PasswordInput
          id="register-password"
          withIcon
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
      </FormField>
      <FormField
        label="Confirm password"
        htmlFor="register-confirmPassword"
        required
        error={fieldErrors.confirmPassword}
      >
        <PasswordInput
          id="register-confirmPassword"
          withIcon
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="w-full" disabled={isLoading} onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Create account'}
        </Button>
      </div>
    </Form>
  )
}
