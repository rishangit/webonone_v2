import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  FeaturePage,
  Form,
  FormField,
  Input,
  mapZodIssuesToFieldErrors,
  Spinner,
  Textarea,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { emailApi } from '@/shared/services/emailApi'
import type { CompanyBranding } from '@/shared/types/email.types'
import { brandingSchema, type BrandingFormValues } from '../schemas/brandingSchemas'

type SettingsTab = 'global' | 'branding'

function brandingToFormValues(branding: CompanyBranding): BrandingFormValues {
  return {
    companyName: branding.name,
    logoUrl: branding.logoUrl ?? '',
    primaryColor: branding.primaryColor ?? '#2563eb',
    contactEmail: branding.contactEmail ?? '',
    footerHtml: branding.footerHtml ?? '',
  }
}

export function SettingsPage() {
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? null)
  const isSuperAdmin = role === 'super_admin'
  const defaultTab: SettingsTab = isSuperAdmin ? 'global' : 'branding'
  const [tab, setTab] = useState<SettingsTab>(defaultTab)
  const [values, setValues] = useState<BrandingFormValues>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#2563eb',
    contactEmail: '',
    footerHtml: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BrandingFormValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (tab !== 'branding' || !companyId) return
    const brandingCompanyId = companyId

    async function loadBranding() {
      setLoading(true)
      setError(null)
      try {
        const branding = await emailApi.getBranding(brandingCompanyId)
        setValues(brandingToFormValues(branding))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load branding')
      } finally {
        setLoading(false)
      }
    }

    void loadBranding()
  }, [tab, companyId])

  function patchValues(patch: Partial<BrandingFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  async function handleSaveBranding(event: React.FormEvent) {
    event.preventDefault()
    if (!companyId) {
      setError('No company associated with your account')
      return
    }

    const payload = {
      ...values,
      logoUrl: values.logoUrl?.trim() || undefined,
      footerHtml: values.footerHtml?.trim() || undefined,
    }

    const result = brandingSchema.safeParse(payload)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await emailApi.updateBranding(companyId, {
        name: result.data.companyName,
        logoUrl: result.data.logoUrl || null,
        primaryColor: result.data.primaryColor,
        contactEmail: result.data.contactEmail,
        footerHtml: result.data.footerHtml || null,
      })
      setValues(brandingToFormValues(updated))
      setSuccess('Branding saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FeaturePage
      title="Settings"
      description={
        isSuperAdmin
          ? 'Global email defaults and company branding.'
          : 'Customize email branding for your company.'
      }
    >
      <div className="flex flex-wrap gap-2">
        {isSuperAdmin ? (
          <Button
            type="button"
            size="sm"
            variant={tab === 'global' ? 'default' : 'outline'}
            onClick={() => setTab('global')}
          >
            Global defaults
          </Button>
        ) : null}
        {(isSuperAdmin || role === 'company_admin') && companyId ? (
          <Button
            type="button"
            size="sm"
            variant={tab === 'branding' ? 'default' : 'outline'}
            onClick={() => setTab('branding')}
          >
            Branding
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {tab === 'global' && isSuperAdmin ? (
        <section className="space-y-3 rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium">Global defaults</h2>
          <p className="text-sm text-muted-foreground">
            Platform-wide from-name overrides and audit settings are managed on the server. Use the
            audit log in your operations tooling for send history exports.
          </p>
          <p className="text-sm text-muted-foreground">
            SMTP provider configuration is available under Providers.
          </p>
        </section>
      ) : null}

      {tab === 'branding' ? (
        !companyId ? (
          <p className="text-sm text-muted-foreground">No company is linked to your account.</p>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <Form onSubmit={handleSaveBranding} className="space-y-4">
              <FormField
                label="Company name"
                htmlFor="branding-name"
                required
                error={fieldErrors.companyName}
              >
                <Input
                  id="branding-name"
                  value={values.companyName}
                  onChange={(e) => patchValues({ companyName: e.target.value })}
                />
              </FormField>

              <FormField label="Logo URL" htmlFor="branding-logo" error={fieldErrors.logoUrl}>
                <Input
                  id="branding-logo"
                  value={values.logoUrl ?? ''}
                  onChange={(e) => patchValues({ logoUrl: e.target.value })}
                  placeholder="https://…"
                />
              </FormField>

              <FormField
                label="Primary color"
                htmlFor="branding-color"
                required
                error={fieldErrors.primaryColor}
              >
                <ColorInput
                  id="branding-color"
                  value={values.primaryColor}
                  onChange={(primaryColor) => patchValues({ primaryColor })}
                />
              </FormField>

              <FormField
                label="Contact email"
                htmlFor="branding-contact"
                required
                error={fieldErrors.contactEmail}
              >
                <Input
                  id="branding-contact"
                  type="email"
                  value={values.contactEmail}
                  onChange={(e) => patchValues({ contactEmail: e.target.value })}
                />
              </FormField>

              <FormField label="Footer HTML" htmlFor="branding-footer" error={fieldErrors.footerHtml}>
                <Textarea
                  id="branding-footer"
                  rows={4}
                  value={values.footerHtml ?? ''}
                  onChange={(e) => patchValues({ footerHtml: e.target.value })}
                />
              </FormField>

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save branding'}
              </Button>
            </Form>

            <section className="space-y-3 rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium">Live preview</h2>
              <div
                className="rounded-lg border border-border p-4"
                style={{ borderTopColor: values.primaryColor, borderTopWidth: 4 }}
              >
                {values.logoUrl ? (
                  <img
                    src={values.logoUrl}
                    alt=""
                    className="mb-3 h-10 max-w-[160px] object-contain"
                  />
                ) : null}
                <p className="font-semibold" style={{ color: values.primaryColor }}>
                  {values.companyName || 'Company name'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contact: {values.contactEmail || 'contact@example.com'}
                </p>
                {values.footerHtml ? (
                  <div
                    className="prose prose-sm mt-4 max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: values.footerHtml }}
                  />
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">Footer content appears here.</p>
                )}
              </div>
            </section>
          </div>
        )
      ) : null}
    </FeaturePage>
  )
}
