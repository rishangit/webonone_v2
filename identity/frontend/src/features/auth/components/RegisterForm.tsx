import { useState } from 'react'
import { Mail, User } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormField,
  Input,
  InputGroup,
  InputGroupIcon,
  PasswordInput,
  mapZodIssuesToFieldErrors,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { registerSchema, type RegisterFormValues } from '../schemas/authSchemas'
import { authActions } from '../store'

export function RegisterForm() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<RegisterFormValues>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(authActions.clearAuthError())
    dispatch(authActions.registerRequested(parsed.data))
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="First name" htmlFor="firstName" required error={fieldErrors.firstName}>
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="firstName"
              inGroup
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
            />
          </InputGroup>
        </FormField>
        <FormField label="Last name" htmlFor="lastName" required error={fieldErrors.lastName}>
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="lastName"
              inGroup
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
            />
          </InputGroup>
        </FormField>
      </div>
      <FormField label="Email" htmlFor="email" required error={fieldErrors.email}>
        <InputGroup>
          <InputGroupIcon icon={Mail} />
          <Input
            id="email"
            inGroup
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
        </InputGroup>
      </FormField>
      <FormField label="Password" htmlFor="password" required error={fieldErrors.password}>
        <PasswordInput
          id="password"
          withIcon
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Create account'}
      </Button>
    </Form>
  )
}
