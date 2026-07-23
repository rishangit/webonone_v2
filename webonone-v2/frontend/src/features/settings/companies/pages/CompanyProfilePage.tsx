import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3 } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  FeaturePage,
  Form,
  cn,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
  parsePhoneE164,
  type PhoneCountry,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import {
  companyContactCardSchema,
  companyLocationCardSchema,
  companyProfileCardSchema,
  type CompanyContactCardValues,
  type CompanyLocationCardValues,
  type CompanyProfileCardValues,
} from '@/features/settings/basic/schemas/companySchemas'
import type { CompanyDetail, CompanyTag } from '@/features/settings/basic/services/companyApi'
import { CompanyContactCard } from '../components/CompanyContactCard'
import { CompanyGalleryCard } from '../components/CompanyGalleryCard'
import { CompanyLocationCard } from '../components/CompanyLocationCard'
import { CompanyLogoCard } from '../components/CompanyLogoCard'
import { CompanyProfileCard } from '../components/CompanyProfileCard'
import { CompanyTagsCard } from '../components/CompanyTagsCard'

type CompanyProfilePageProps = {
  backTo: string
  backLabel: string
}

type CompanyProfileTab = 'profile' | 'gallery'

const TABS: { id: CompanyProfileTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'gallery', label: 'Gallery' },
]

function profileFromDetail(detail: CompanyDetail): CompanyProfileCardValues {
  return {
    name: detail.name,
    description: detail.description ?? '',
    companySize: (detail.companySize as CompanyProfileCardValues['companySize']) || '1-10',
  }
}

function locationFromDetail(detail: CompanyDetail): CompanyLocationCardValues {
  return {
    addressLine1: detail.addressLine1 ?? '',
    addressLine2: detail.addressLine2 ?? '',
    city: detail.city ?? '',
    stateRegion: detail.stateRegion ?? '',
    postalCode: detail.postalCode ?? '',
    country: detail.country ?? '',
    latitude: detail.latitude,
    longitude: detail.longitude,
    mapPlaceId: detail.mapPlaceId,
    mapFormattedAddress: detail.mapFormattedAddress,
  }
}

function phoneFromDetail(detail: CompanyDetail) {
  const parsed = parsePhoneE164(detail.contactPhone, {
    fallbackIso2: getBrowserDefaultCountryIso2(),
  })
  return { phoneCountry: parsed.iso2, phoneNational: parsed.nationalNumber }
}

export function CompanyProfilePage({ backTo, backLabel }: CompanyProfilePageProps) {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)

  const [tab, setTab] = useState<CompanyProfileTab>('profile')
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [profileValues, setProfileValues] = useState<CompanyProfileCardValues | null>(null)
  const [locationValues, setLocationValues] = useState<CompanyLocationCardValues | null>(null)
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [tags, setTags] = useState<CompanyTag[]>([])
  const [profileErrors, setProfileErrors] = useState<
    Partial<Record<keyof CompanyProfileCardValues, string>>
  >({})
  const [contactErrors, setContactErrors] = useState<
    Partial<Record<keyof CompanyContactCardValues, string>>
  >({})
  const [locationErrors, setLocationErrors] = useState<
    Partial<Record<keyof CompanyLocationCardValues, string>>
  >({})

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

  useEffect(() => {
    if (!detail) return
    setProfileValues(profileFromDetail(detail))
    setLocationValues(locationFromDetail(detail))
    setEmail(detail.contactEmail ?? '')
    const phone = phoneFromDetail(detail)
    setPhoneCountry(phone.phoneCountry)
    setPhoneNational(phone.phoneNational)
    setTags(detail.tags ?? [])
    setProfileErrors({})
    setContactErrors({})
    setLocationErrors({})
    setMode('view')
  }, [detail])

  const canEdit =
    Boolean(detail) &&
    (detail?.role === 'company_admin' || activeRole === 'super_admin')

  function handleCancelEdit() {
    if (!detail) return
    setProfileValues(profileFromDetail(detail))
    setLocationValues(locationFromDetail(detail))
    setEmail(detail.contactEmail ?? '')
    const phone = phoneFromDetail(detail)
    setPhoneCountry(phone.phoneCountry)
    setPhoneNational(phone.phoneNational)
    setTags(detail.tags ?? [])
    setProfileErrors({})
    setContactErrors({})
    setLocationErrors({})
    setMode('view')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyId || !profileValues || !locationValues) return

    const contactPhone = formatPhoneE164(phoneCountry, phoneNational) || phoneNational.trim()
    const profileParsed = companyProfileCardSchema.safeParse(profileValues)
    const contactParsed = companyContactCardSchema.safeParse({
      contactEmail: email,
      contactPhone,
    })
    const locationParsed = companyLocationCardSchema.safeParse(locationValues)

    setProfileErrors(
      profileParsed.success ? {} : mapZodIssuesToFieldErrors(profileParsed.error.issues),
    )
    setContactErrors(
      contactParsed.success ? {} : mapZodIssuesToFieldErrors(contactParsed.error.issues),
    )
    setLocationErrors(
      locationParsed.success ? {} : mapZodIssuesToFieldErrors(locationParsed.error.issues),
    )

    if (!profileParsed.success || !contactParsed.success || !locationParsed.success) {
      return
    }

    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: {
          name: profileParsed.data.name,
          description: profileParsed.data.description,
          companySize: profileParsed.data.companySize,
          contactEmail: contactParsed.data.contactEmail,
          contactPhone: contactParsed.data.contactPhone,
          addressLine1: locationParsed.data.addressLine1,
          addressLine2: locationParsed.data.addressLine2.trim() || null,
          city: locationParsed.data.city,
          stateRegion: locationParsed.data.stateRegion.trim() || null,
          postalCode: locationParsed.data.postalCode.trim() || null,
          country: locationParsed.data.country,
          latitude: locationParsed.data.latitude,
          longitude: locationParsed.data.longitude,
          mapPlaceId: locationParsed.data.mapPlaceId,
          mapFormattedAddress: locationParsed.data.mapFormattedAddress,
          tags,
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
        description="Update company details and gallery images."
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

  if (!detail || !profileValues || !locationValues || !companyId) {
    return null
  }

  const cards = (
    <>
      <div className="flex flex-col gap-6 lg:col-span-2">
        <CompanyProfileCard
          detail={detail}
          mode={mode}
          values={profileValues}
          errors={profileErrors}
          onChange={setProfileValues}
        />
        <CompanyLocationCard
          detail={detail}
          mode={mode}
          values={locationValues}
          errors={locationErrors}
          onChange={setLocationValues}
        />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-1">
        <CompanyContactCard
          detail={detail}
          mode={mode}
          email={email}
          phoneCountry={phoneCountry}
          phoneNational={phoneNational}
          errors={contactErrors}
          onEmailChange={setEmail}
          onPhoneCountryChange={(country: PhoneCountry) => setPhoneCountry(country.iso2)}
          onPhoneNationalChange={setPhoneNational}
        />
        <CompanyTagsCard mode={mode} tags={tags} onChange={setTags} />
      </div>
    </>
  )

  const showProfileEditActions = tab === 'profile' && canEdit

  return (
    <FeaturePage
      title={detail.name}
      description="Update company details and gallery images."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Button>
          {showProfileEditActions ? (
            mode === 'view' ? (
              <Button type="button" size="sm" onClick={() => setMode('edit')}>
                <Edit3 className="h-4 w-4" aria-hidden />
                Edit
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" form="company-profile-form" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </>
            )
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {detailError ? (
          <Alert variant="destructive">
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : null}

        <div
          role="tablist"
          aria-label="Company profile sections"
          className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`company-profile-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`company-profile-panel-${item.id}`}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
                tab === item.id && 'bg-background text-foreground shadow-sm',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`company-profile-panel-${tab}`}
          aria-labelledby={`company-profile-tab-${tab}`}
        >
          {tab === 'profile' ? (
            mode === 'edit' ? (
              <Form
                id="company-profile-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 items-start gap-6 space-y-0 lg:grid-cols-3"
              >
                {cards}
              </Form>
            ) : (
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">{cards}</div>
            )
          ) : (
            <div className="flex flex-col gap-6">
              <CompanyLogoCard
                companyId={companyId}
                logoUrl={detail.logoUrl}
                canEdit={canEdit}
                saving={saving}
              />
              <CompanyGalleryCard
                companyId={companyId}
                galleryImages={detail.galleryImages ?? []}
                canEdit={canEdit}
                saving={saving}
              />
            </div>
          )}
        </div>
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
