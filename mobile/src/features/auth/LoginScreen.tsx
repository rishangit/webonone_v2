import { useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, Heading, Muted, Screen, TextField } from '@/ui'
import { useSession } from './SessionContext'
import { isGoogleSignInAvailable } from './googleSignIn'
import { loginSchema, type LoginFormValues } from './loginSchema'

export function LoginScreen() {
  const { login, loginWithGoogle } = useSession()
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const showGoogle = isGoogleSignInAvailable()

  async function handleSubmit() {
    const result = loginSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof LoginFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !errors[key as keyof LoginFormValues]) {
          errors[key as keyof LoginFormValues] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await login(result.data.email, result.data.password)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setFormError(null)
    setGoogleSubmitting(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  const busy = submitting || googleSubmitting

  return (
    <Screen>
      <View className="gap-1">
        <Heading>Sign in to SMS</Heading>
        <Muted>Sign in with your WebOnOne account to configure the SMS gateway.</Muted>
      </View>

      <Card className="gap-4">
        <TextField
          label="Email"
          required
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={values.email}
          onChangeText={(email) => setValues((prev) => ({ ...prev, email }))}
          error={fieldErrors.email}
        />
        <TextField
          label="Password"
          required
          secureTextEntry
          autoComplete="password"
          value={values.password}
          onChangeText={(password) => setValues((prev) => ({ ...prev, password }))}
          error={fieldErrors.password}
        />
        {formError ? <Body className="text-destructive">{formError}</Body> : null}
        <Button loading={submitting} disabled={busy} onPress={handleSubmit}>
          Sign in
        </Button>

        {showGoogle ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Muted>or</Muted>
              <View className="h-px flex-1 bg-border" />
            </View>
            <Button
              variant="outline"
              loading={googleSubmitting}
              disabled={busy}
              onPress={handleGoogle}
            >
              Continue with Google
            </Button>
          </View>
        ) : null}
      </Card>
    </Screen>
  )
}
