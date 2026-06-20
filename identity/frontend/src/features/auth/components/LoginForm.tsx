import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { loginSchema, type LoginFormValues } from '../schemas/authSchemas'
import { authActions } from '../store'

export function LoginForm() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(authActions.clearAuthError())
    dispatch(authActions.loginRequested(parsed.data))
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
        <Input
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" required error={fieldErrors.password}>
        <Input
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Sign in'}
      </Button>
    </Form>
  )
}
