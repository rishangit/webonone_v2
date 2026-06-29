import { useEffect, useMemo, useState } from 'react'
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
import {
  legacyResetPasswordSchema,
  resetPasswordSchema,
  type LegacyResetPasswordFormValues,
  type ResetPasswordFormValues,
} from '../schemas/authSchemas'
import { authActions } from '../store'
import { loadResetSessionToken } from '../utils/resetSessionStorage'

interface ResetPasswordFormProps {
  resetSessionToken?: string | null
  legacyToken?: string
}

export function ResetPasswordForm({ resetSessionToken, legacyToken = '' }: ResetPasswordFormProps) {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const sessionToken = useMemo(
    () => resetSessionToken ?? loadResetSessionToken(),
    [resetSessionToken],
  )
  const isLegacyMode = !sessionToken && Boolean(legacyToken)

  const [otpValues, setOtpValues] = useState<ResetPasswordFormValues>({
    resetSessionToken: sessionToken ?? '',
    newPassword: '',
  })
  const [legacyValues, setLegacyValues] = useState<LegacyResetPasswordFormValues>({
    token: legacyToken,
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})

  useEffect(() => {
    if (sessionToken) {
      setOtpValues((v) => ({ ...v, resetSessionToken: sessionToken }))
    }
  }, [sessionToken])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLegacyMode) {
      const parsed = legacyResetPasswordSchema.safeParse(legacyValues)
      if (!parsed.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        return
      }
      setFieldErrors({})
      dispatch(authActions.clearAuthError())
      dispatch(
        authActions.legacyResetPasswordRequested({
          token: parsed.data.token,
          newPassword: parsed.data.newPassword,
        }),
      )
      return
    }

    const parsed = resetPasswordSchema.safeParse(otpValues)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    dispatch(authActions.clearAuthError())
    dispatch(authActions.resetPasswordRequested(parsed.data))
  }

  if (!sessionToken && !legacyToken) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Your reset session expired. Request a new verification code from forgot password.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {isLegacyMode ? (
        <FormField label="Reset token" htmlFor="token" required error={fieldErrors.token}>
          <Input
            id="token"
            value={legacyValues.token}
            onChange={(e) => setLegacyValues((v) => ({ ...v, token: e.target.value }))}
          />
        </FormField>
      ) : null}
      <FormField label="New password" htmlFor="newPassword" required error={fieldErrors.newPassword}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={isLegacyMode ? legacyValues.newPassword : otpValues.newPassword}
          onChange={(e) =>
            isLegacyMode
              ? setLegacyValues((v) => ({ ...v, newPassword: e.target.value }))
              : setOtpValues((v) => ({ ...v, newPassword: e.target.value }))
          }
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : 'Reset password'}
      </Button>
    </Form>
  )
}
