import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  AuthLayout,
  Body,
  Button,
  Card,
  Muted,
  PasswordInput,
  Spinner,
  Subheading,
  useToast,
} from '@webonone/mobile-ui'
import { AuthLink } from './components/AuthLink'
import { authApi } from './authApi'
import {
  mapZodIssuesToFieldErrors,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from './schemas/authSchemas'
import { clearResetSessionToken, loadResetSessionToken } from './utils/authFlowStorage'

interface ResetPasswordPreview {
  email: string | null
  firstName: string
  lastName: string
}

function AccountDetailsCard({
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
    <Card className="gap-3">
      <Subheading className="text-sm">{heading}</Subheading>
      <View className="gap-2">
        <View>
          <Muted>{emailLabel}</Muted>
          <Body>{preview.email ?? '—'}</Body>
        </View>
        <View>
          <Muted>{firstNameLabel}</Muted>
          <Body>{preview.firstName}</Body>
        </View>
        <View>
          <Muted>{lastNameLabel}</Muted>
          <Body>{preview.lastName}</Body>
        </View>
      </View>
    </Card>
  )
}

export function ResetPasswordScreen() {
  const { t } = useTranslation('auth')
  const router = useRouter()
  const { toast } = useToast()
  const [resetSessionToken, setResetSessionToken] = useState<string | null>(null)
  const [values, setValues] = useState<ResetPasswordFormValues>({
    resetSessionToken: '',
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ResetPasswordPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void loadResetSessionToken().then((token) => {
      if (!token) {
        router.replace('/forgot-password')
        return
      }
      setResetSessionToken(token)
      setValues((prev) => ({ ...prev, resetSessionToken: token }))
    })
  }, [router])

  useEffect(() => {
    if (!resetSessionToken) return

    let cancelled = false
    setPreviewLoading(true)
    setPreviewError(null)
    setPreview(null)

    void authApi
      .previewResetPassword(resetSessionToken)
      .then((user) => {
        if (!cancelled) setPreview(user)
      })
      .catch((err: Error) => {
        if (!cancelled) setPreviewError(err.message ?? t('errors.verificationFailed'))
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [resetSessionToken, t])

  const previewBlocked = previewLoading || previewError !== null || preview === null
  const submitDisabled = loading || previewBlocked || !resetSessionToken

  async function handleSubmit() {
    if (submitDisabled || !resetSessionToken) return

    const parsed = resetPasswordSchema.safeParse({
      resetSessionToken,
      newPassword: values.newPassword,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setLoading(true)

    try {
      await authApi.resetPassword(parsed.data.resetSessionToken, parsed.data.newPassword)
      await clearResetSessionToken()
      toast({ title: t('resetPassword') })
      router.replace('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.verificationFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!resetSessionToken) {
    return null
  }

  return (
    <AuthLayout
      title={t('resetPassword')}
      description={t('resetPasswordDescription')}
      footer={<AuthLink label={t('backToSignIn')} href="/login" />}
    >
      <View className="gap-4">
        {previewLoading ? (
          <View className="items-center py-4">
            <Spinner />
          </View>
        ) : null}
        {previewError ? (
          <Alert variant="destructive">
            <AlertDescription>{previewError}</AlertDescription>
          </Alert>
        ) : null}
        {preview ? (
          <AccountDetailsCard
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
        <PasswordInput
          label={t('newPassword')}
          required
          withIcon
          autoComplete="new-password"
          value={values.newPassword}
          onChangeText={(newPassword) => setValues((prev) => ({ ...prev, newPassword }))}
          error={fieldErrors.newPassword ? t(fieldErrors.newPassword) : undefined}
        />
        <Button className="w-full" loading={loading} disabled={submitDisabled} onPress={handleSubmit}>
          {t('resetPassword')}
        </Button>
      </View>
    </AuthLayout>
  )
}
