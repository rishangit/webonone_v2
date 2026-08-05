import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  ColorInput,
  FeaturePage,
  Form,
  FormField,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  mapZodIssuesToFieldErrors,
  Textarea,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { settingsActions } from '@/features/settings/store'
import type { CompanyBranding } from '@/shared/types/email.types'
import { useDetailTabParam } from '../hooks/useDetailTabParam'
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
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.user?.role ?? 'member')
  const companyId = useAppSelector((s) => s.auth.user?.companyId ?? null)
  const { branding, status, error } = useAppSelector((s) => s.settings)

  const isSuperAdmin = role === 'super_admin'
  const defaultTab: SettingsTab = isSuperAdmin ? 'global' : 'branding'
  const allowedTabs = useMemo((): readonly SettingsTab[] => {
    if (isSuperAdmin && companyId) return ['global', 'branding']
    if (isSuperAdmin) return ['global']
    return ['branding']
  }, [companyId, isSuperAdmin])
  const [tab, setTab] = useDetailTabParam(allowedTabs, defaultTab)
  const [values, setValues] = useState<BrandingFormValues>({
    companyName: '',
    logoUrl: '',
    primaryColor: '#2563eb',
    contactEmail: '',
    footerHtml: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BrandingFormValues, string>>>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [awaitingSave, setAwaitingSave] = useState(false)

  const loading = tab === 'branding' && status === 'loading' && !branding
  const saving = status === 'saving'

  usePlatformLoading(loading ? 'Loading settings…' : null)

  useEffect(() => {
    if (tab !== 'branding' || !companyId) return
    dispatch(settingsActions.loadBrandingRequested({ companyId }))
  }, [tab, companyId, dispatch])

  useEffect(() => {
    if (branding && branding.companyId === companyId) {
      setValues(brandingToFormValues(branding))
    }
  }, [branding, companyId])

  useEffect(() => {
    if (awaitingSave && status === 'idle' && !error) {
      setSuccess('Branding saved.')
      setAwaitingSave(false)
    }
    if (awaitingSave && status === 'error') {
      setAwaitingSave(false)
    }
  }, [awaitingSave, error, status])

  function patchValues(patch: Partial<BrandingFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleSaveBranding(event: React.FormEvent) {
    event.preventDefault()
    if (!companyId) return

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
    setSuccess(null)
    setAwaitingSave(true)

    dispatch(
      settingsActions.saveBrandingRequested({
        companyId,
        body: {
          name: result.data.companyName,
          logoUrl: result.data.logoUrl || null,
          primaryColor: result.data.primaryColor,
          contactEmail: result.data.contactEmail,
          footerHtml: result.data.footerHtml || null,
        },
      }),
    )
  }

  const settingsTabs = useMemo(() => {
    const items: { id: SettingsTab; label: string }[] = []
    if (isSuperAdmin) {
      items.push({ id: 'global', label: 'Global defaults' })
    }
    if ((isSuperAdmin || role === 'company_admin') && companyId) {
      items.push({ id: 'branding', label: 'Branding' })
    }
    return items
  }, [companyId, isSuperAdmin, role])

  return (
    <FeaturePage
      title="Settings"
      description={
        isSuperAdmin
          ? 'Global email defaults and company branding.'
          : 'Customize email branding for your company.'
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SettingsTab)}
        className="flex flex-col gap-6"
      >
        {settingsTabs.length > 0 ? (
          <TabsList aria-label="Settings sections">
            {settingsTabs.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : null}

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

        <TabsContent value="global" className="mt-0 outline-none">
          {isSuperAdmin ? (
            <section className="space-y-3 rounded-lg border border-border p-6">
              <h2 className="text-lg font-medium">Global defaults</h2>
              <p className="text-sm text-muted-foreground">
                Platform-wide from-name overrides and audit settings are managed on the server. Use
                the audit log in your operations tooling for send history exports.
              </p>
              <p className="text-sm text-muted-foreground">
                SMTP provider configuration is available under Providers.
              </p>
            </section>
          ) : null}
        </TabsContent>

        <TabsContent value="branding" className="mt-0 outline-none">
          {!companyId ? (
            <p className="text-sm text-muted-foreground">No company is linked to your account.</p>
          ) : loading ? null : (
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

                <FormField
                  label="Footer HTML"
                  htmlFor="branding-footer"
                  error={fieldErrors.footerHtml}
                >
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
          )}
        </TabsContent>
      </Tabs>
    </FeaturePage>
  )
}
