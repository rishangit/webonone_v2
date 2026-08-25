import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { authApi } from '@/shared/services/authApi'
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

interface ResetPasswordPreview {
  email: string | null
  firstName: string
  lastName: string
}

function AccountDetailsBlock({
  preview,
  heading,
  emailLabel,
  firstNameLabel,
  lastNameLabel,
}: {
  preview: ResetPasswordPreview
  heading: string
  emailLabel: string
  firstNameLabel: string
  lastNameLabel: string
}) {
  return (
    <div
      className="space-y-3 rounded-lg border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4"
    >
      <p className="text-sm font-medium text-foreground">{heading}</p>
      <div className="space-y-2">
        <div>
          <p className="text-sm text-muted-foreground">{emailLabel}</p>
          <p className="text-foreground">{preview.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{firstNameLabel}</p>
          <p className="text-foreground">{preview.firstName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{lastNameLabel}</p>
          <p className="text-foreground">{preview.lastName}</p>
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordForm({ resetSessionToken, legacyToken = '' }: ResetPasswordFormProps) {
  const { t } = useTranslation('auth')
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)
  const sessionToken = useMemo(
    () => resetSessionToken ?? loadResetSessionToken(),
    [resetSessionToken],
  )
  const isLegacyMode = !sessionToken && Boolean(legacyToken)
  const showManualTokenField = isLegacyMode && !legacyToken

  const [otpValues, setOtpValues] = useState<ResetPasswordFormValues>({
    resetSessionToken: sessionToken ?? '',
    newPassword: '',
  })
  const [legacyValues, setLegacyValues] = useState<LegacyResetPasswordFormValues>({
    token: legacyToken,
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [preview, setPreview] = useState<ResetPasswordPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionToken) {
      setOtpValues((v) => ({ ...v, resetSessionToken: sessionToken }))
    }
  }, [sessionToken])

  useEffect(() => {
    if (legacyToken) {
      setLegacyValues((v) => ({ ...v, token: legacyToken }))
    }
  }, [legacyToken])

  useEffect(() => {
    if (!sessionToken && !legacyToken) {
      return
    }

    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(null)
    setPreview(null)

    const body = sessionToken ? { resetSessionToken: sessionToken } : { token: legacyToken }

    authApi
      .previewResetPassword(body)
      .then((result) => {
        if (!cancelled) {
          setPreview(result.user)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setPreviewError(err.message ?? t('errors.verificationFailed'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [sessionToken, legacyToken, t])

  const previewBlocked = previewLoading || previewError !== null || preview === null
  const submitDisabled = isLoading || previewBlocked

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (previewBlocked) return

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
        <AlertDescription>{t('resetSessionExpired')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {previewLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="lg" />
        </div>
      ) : null}
      {previewError ? (
        <Alert variant="destructive">
          <AlertDescription>{previewError}</AlertDescription>
        </Alert>
      ) : null}
      {preview ? (
        <AccountDetailsBlock
          preview={preview}
          heading={t('resetPasswordAccountHeading')}
          emailLabel={t('email')}
          firstNameLabel={t('firstName')}
          lastNameLabel={t('lastName')}
        />
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {showManualTokenField ? (
        <FormField
          label={t('resetToken')}
          htmlFor="token"
          required
          error={fieldErrors.token ? t(fieldErrors.token) : undefined}
        >
          <Input
            id="token"
            value={legacyValues.token}
            onChange={(e) => setLegacyValues((v) => ({ ...v, token: e.target.value }))}
          />
        </FormField>
      ) : null}
      <FormField
        label={t('newPassword')}
        htmlFor="newPassword"
        required
        error={fieldErrors.newPassword ? t(fieldErrors.newPassword) : undefined}
      >
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
      <Button type="submit" className="w-full" disabled={submitDisabled}>
        {isLoading ? <Spinner size="sm" /> : t('resetPassword')}
      </Button>
    </Form>
  )
}
