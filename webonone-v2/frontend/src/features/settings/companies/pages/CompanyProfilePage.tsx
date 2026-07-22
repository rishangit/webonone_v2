import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription, Button, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import type {
  CompanyContactCardValues,
  CompanyLocationCardValues,
  CompanyProfileCardValues,
} from '@/features/settings/basic/schemas/companySchemas'
import { CompanyContactCard } from '../components/CompanyContactCard'
import { CompanyLocationCard } from '../components/CompanyLocationCard'
import { CompanyProfileCard } from '../components/CompanyProfileCard'

type CompanyProfilePageProps = {
  backTo: string
  backLabel: string
}

export function CompanyProfilePage({ backTo, backLabel }: CompanyProfilePageProps) {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const loading = detailStatus === 'loading' && !detail
  const saving = detailStatus === 'saving'

  usePlatformLoading(loading ? 'Loading company…' : null)

  useEffect(() => {
    if (!companyId) return
    dispatch(companiesActions.loadCompanyDetailRequested({ id: companyId }))
    return () => {
      dispatch(companiesActions.clearCompanyDetail())
    }
  }, [companyId, dispatch])

  const canEdit =
    Boolean(detail) &&
    (detail?.role === 'company_admin' || activeRole === 'super_admin')

  function handleProfileSave(values: CompanyProfileCardValues) {
    if (!companyId) return
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: {
          name: values.name,
          description: values.description,
          companySize: values.companySize,
        },
      }),
    )
  }

  function handleContactSave(values: CompanyContactCardValues) {
    if (!companyId) return
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: {
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
        },
      }),
    )
  }

  function handleLocationSave(values: CompanyLocationCardValues) {
    if (!companyId) return
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: {
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2.trim() || null,
          city: values.city,
          stateRegion: values.stateRegion.trim() || null,
          postalCode: values.postalCode.trim() || null,
          country: values.country,
          latitude: values.latitude,
          longitude: values.longitude,
          mapPlaceId: values.mapPlaceId,
          mapFormattedAddress: values.mapFormattedAddress,
        },
      }),
    )
  }

  if (loading) {
    return null
  }

  if (detailError && !detail) {
    return (
      <FeaturePage
        title="Company profile"
        description="View and update this company’s profile, contact, and location."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Button>
        }
      >
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      </FeaturePage>
    )
  }

  if (!detail) {
    return null
  }

  return (
    <FeaturePage
      title={detail.name}
      description="Complete and update this company’s profile, contact, and location."
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Button>
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-6">
        <CompanyProfileCard
          detail={detail}
          canEdit={canEdit}
          saving={saving}
          onSave={handleProfileSave}
        />
        <CompanyContactCard
          detail={detail}
          canEdit={canEdit}
          saving={saving}
          onSave={handleContactSave}
        />
        <CompanyLocationCard
          detail={detail}
          canEdit={canEdit}
          saving={saving}
          onSave={handleLocationSave}
        />
      </div>
    </FeaturePage>
  )
}

export function MemberCompanyProfilePage() {
  return (
    <CompanyProfilePage backTo="/settings/companies" backLabel="Back to All Companies" />
  )
}

export function AdminCompanyProfilePage() {
  return <CompanyProfilePage backTo="/companies" backLabel="Back to Companies" />
}
