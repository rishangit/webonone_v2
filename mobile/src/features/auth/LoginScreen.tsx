import { useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, Heading, Muted, Screen, TextField } from '@/ui'
import { useSession } from './SessionContext'
import { loginSchema, type LoginFormValues } from './loginSchema'

export function LoginScreen() {
  const { login } = useSession()
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
        <Button loading={submitting} onPress={handleSubmit}>
          Sign in
        </Button>
      </Card>
    </Screen>
  )
}
