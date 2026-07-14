import { useEffect, useState } from 'react'
import { Button, Callout, CalloutDescription, CalloutTitle, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { RegisterCompanyDialog } from '../components/RegisterCompanyDialog'
import { UserSelectionDemo } from '../components/UserSelectionDemo'
import type { RegisterCompanyFormValues } from '../schemas/companySchemas'
import type { CompanySummary } from '../services/companyApi'
import { companiesActions } from '../store/companiesStore'

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
  const dispatch = useAppDispatch()
  const { myCompany, myCompanyStatus, myCompanyError, myCompanyFetchedAt } = useAppSelector(
    (s) => s.companies,
  )
  const [registerOpen, setRegisterOpen] = useState(false)
  const [pendingRegister, setPendingRegister] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isFresh(myCompanyFetchedAt)) {
      dispatch(companiesActions.loadMyCompanyRequested())
    }
  }, [dispatch, myCompanyFetchedAt])

  useEffect(() => {
    if (!pendingRegister) return

    if (myCompanyStatus === 'idle') {
      setRegisterOpen(false)
      setSuccessMessage(
        'Registration submitted. Admin approval is required before you can manage company details.',
      )
      setPendingRegister(false)
    } else if (myCompanyStatus === 'error') {
      setPendingRegister(false)
    }
  }, [myCompanyStatus, pendingRegister])

  const isSubmitting = myCompanyStatus === 'saving' && pendingRegister
  const submitError = myCompanyStatus === 'error' && pendingRegister ? myCompanyError : null
  const isInitialLoad = myCompany === undefined && myCompanyStatus === 'loading'

  usePlatformLoading(isInitialLoad ? 'Loading company settings…' : null)

  function handleRegister(values: RegisterCompanyFormValues) {
    setSuccessMessage(null)
    setPendingRegister(true)
    dispatch(companiesActions.registerCompanyRequested(values))
  }

  if (isInitialLoad) {
    return null
  }

  const company = myCompany ?? null
  const loadError =
    myCompanyStatus === 'error' && !pendingRegister && company === null ? myCompanyError : null

  return (
    <FeaturePage
      title="Basic Settings"
      description="Register and manage your company on the platform."
    >
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

      <UserSelectionDemo />

      <RegisterCompanyDialog
        open={registerOpen}
        isSubmitting={isSubmitting}
        error={submitError}
        onOpenChange={setRegisterOpen}
        onSubmit={handleRegister}
      />
    </FeaturePage>
  )
}
