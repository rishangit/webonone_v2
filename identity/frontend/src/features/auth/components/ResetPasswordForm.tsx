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
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/authSchemas'
import { authActions } from '../store'

interface ResetPasswordFormProps {
  initialToken?: string
}

export function ResetPasswordForm({ initialToken = '' }: ResetPasswordFormProps) {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const [values, setValues] = useState<ResetPasswordFormValues>({
    token: initialToken,
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordFormValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = resetPasswordSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(authActions.clearAuthError())
    dispatch(authActions.resetPasswordRequested(parsed.data))
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Reset token" htmlFor="token" required error={fieldErrors.token}>
        <Input
          value={values.token}
          onChange={(e) => setValues((v) => ({ ...v, token: e.target.value }))}
        />
      </FormField>
      <FormField label="New password" htmlFor="newPassword" required error={fieldErrors.newPassword}>
        <Input
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(e) => setValues((v) => ({ ...v, newPassword: e.target.value }))}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Reset password'}
      </Button>
    </Form>
  )
}
