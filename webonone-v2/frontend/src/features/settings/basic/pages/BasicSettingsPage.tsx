import { useEffect, useState } from 'react'
import { Button, Callout, CalloutDescription, CalloutTitle } from '@webonone/ui-kit'
import { RegisterCompanyDialog } from '../components/RegisterCompanyDialog'
import { companyApi, type CompanySummary } from '../services/companyApi'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'

function statusLabel(status: CompanySummary['company']['status']): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

function statusClassName(status: CompanySummary['company']['status']): string {
  if (status === 'approved') return 'bg-primary/15 text-primary'
  if (status === 'rejected') return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

export function BasicSettingsPage() {
  const [company, setCompany] = useState<CompanySummary | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function loadCompany() {
    setLoadError(null)
    try {
      const data = await companyApi.getMyCompany()
      setCompany(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load company')
      setCompany(null)
    }
  }

  useEffect(() => {
    void loadCompany()
  }, [])

  async function handleRegister(values: RegisterCompanyFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const data = await companyApi.registerCompany(values)
      setCompany(data)
      setRegisterOpen(false)
      setSuccessMessage('Registration submitted. Admin approval is required before you can manage company details.')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (company === undefined) {
    return <p className="text-sm text-muted-foreground">Loading company settings…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Basic Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Register and manage your company on the platform.</p>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

      {!company ? (
        <Callout>
          <CalloutTitle>No company registered</CalloutTitle>
          <CalloutDescription>
            Register your company to manage business details once approved by a platform administrator.
          </CalloutDescription>
          <Button className="mt-4" onClick={() => setRegisterOpen(true)}>
            Register Company
          </Button>
        </Callout>
      ) : (
        <section className="space-y-4 rounded-lg border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">{company.company.name}</h2>
              <p className="text-sm text-muted-foreground">Your company on WebOnOne</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName(company.company.status)}`}
            >
              {statusLabel(company.company.status)}
            </span>
          </div>

          {company.company.logoUrl ? (
            <img
              src={company.company.logoUrl}
              alt={`${company.company.name} logo`}
              className="h-24 w-24 rounded-md object-cover"
            />
          ) : null}

          <p className="text-sm">
            Your role:{' '}
            <span className="font-medium">
              {company.membership.role === 'company_admin' ? 'Company Admin' : 'Member'}
            </span>
          </p>

          {company.company.status === 'pending' ? (
            <p className="text-sm text-muted-foreground">
              Your registration is pending admin approval. You will gain company management features once approved.
            </p>
          ) : null}

          {company.company.status === 'rejected' ? (
            <p className="text-sm text-destructive">
              Your registration was rejected. Contact a platform administrator if you believe this is an error.
            </p>
          ) : null}
        </section>
      )}

      <RegisterCompanyDialog
        open={registerOpen}
        isSubmitting={isSubmitting}
        error={submitError}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegister}
      />
    </div>
  )
}
