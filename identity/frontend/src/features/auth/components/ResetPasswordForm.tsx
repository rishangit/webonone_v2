import { useState } from 'react'
import { Alert, AlertDescription, Button, Form, FormField, Input, Spinner } from '@webonone/ui-kit'
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
      const errors: Partial<Record<keyof ResetPasswordFormValues, string>> = {}
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ResetPasswordFormValues
        errors[key] = issue.message
      })
      setFieldErrors(errors)
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
      <FormField label="Reset token" htmlFor="token" error={fieldErrors.token}>
        <Input
          id="token"
          value={values.token}
          onChange={(e) => setValues((v) => ({ ...v, token: e.target.value }))}
        />
      </FormField>
      <FormField label="New password" htmlFor="newPassword" error={fieldErrors.newPassword}>
        <Input
          id="newPassword"
          type="password"
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
