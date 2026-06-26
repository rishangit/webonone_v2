import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  Button,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import {
  superAdminLoginFormSchema,
  type SuperAdminLoginFormValues,
} from '../schemas/companySchemas'
import { companyApi } from '../services/companyApi'
import { setSuperAdminSession } from '../utils/superAdminSession'

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<SuperAdminLoginFormValues>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SuperAdminLoginFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = superAdminLoginFormSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }

    setFieldErrors({})
    setError(null)
    setIsSubmitting(true)
    try {
      const data = await companyApi.superAdminLogin(result.data)
      setSuperAdminSession(data.accessToken, data.displayName)
      navigate('/admin/companies/pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pt-8">
      <div>
        <h1 className="text-2xl font-semibold">Super Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve pending company registrations.</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Email" htmlFor="super-admin-email" required error={fieldErrors.email}>
          <Input
            id="super-admin-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="Password" htmlFor="super-admin-password" required error={fieldErrors.password}>
          <Input
            id="super-admin-password"
            type="password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            disabled={isSubmitting}
          />
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
