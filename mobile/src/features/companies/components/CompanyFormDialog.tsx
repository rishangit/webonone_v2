import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Body,
  Button,
  CustomDialog,
  Muted,
  Spinner,
  UserSelectionDialog,
  useToast,
} from '@webonone/mobile-ui'
import { useSession } from '@/features/auth/SessionContext'
import { CompanyWizardProgress } from '@/features/companies/components/company-wizard/CompanyWizardProgress'
import { CompanyWizardStepAddress } from '@/features/companies/components/company-wizard/CompanyWizardStepAddress'
import { CompanyWizardStepContact } from '@/features/companies/components/company-wizard/CompanyWizardStepContact'
import { CompanyWizardStepLocation } from '@/features/companies/components/company-wizard/CompanyWizardStepLocation'
import { CompanyWizardStepProfile } from '@/features/companies/components/company-wizard/CompanyWizardStepProfile'
import { CompanyWizardStepSummary } from '@/features/companies/components/company-wizard/CompanyWizardStepSummary'
import { CompanyWizardStepTags } from '@/features/companies/components/company-wizard/CompanyWizardStepTags'
import {
  COMPANY_WIZARD_TOTAL_STEPS,
  companyAddressCardSchema,
  companyContactCardSchema,
  companyLocationCardSchema,
  companyProfileCardSchema,
  companyWizardCreateStep1Schema,
  companyWizardCreateStep2Schema,
  companyWizardCreateStep3Schema,
  companyWizardCreateStep4Schema,
  contactPersonFromAuthUser,
  EMPTY_COMPANY_WIZARD_VALUES,
  mapZodIssuesToFieldErrors,
  registerCompanyFormSchema,
  type CompanyWizardContactPerson,
  type CompanyWizardFormValues,
  type CompanyWizardStep,
  type RegisterCompanyFormValues,
} from '@/features/companies/schemas/companySchemas'
import {
  companyApi,
  type CompanyDetail,
  type UpdateCompanyBody,
} from '@/features/companies/services/companyApi'
import { loadIdentityUsers } from '@/features/companies/services/identityUsersApi'
import {
  contactPhoneFromValues,
  defaultPhoneCountry,
  parsePhoneE164,
} from '@/features/companies/utils/companyPhone'

const STEP_TITLES = ['Profile', 'Contact', 'Address', 'Location', 'Tags', 'Summary'] as const

const STEP_DESCRIPTIONS_CREATE = [
  'Tell us about your company.',
  'How customers and the platform can reach you (optional).',
  'Postal and street address (optional).',
  'Map pin for this company (optional).',
  'Associate catalog tags (optional).',
  'Review your details before submitting.',
] as const

const STEP_DESCRIPTIONS_EDIT = [
  'Company name, description, and size.',
  'Contact email and phone.',
  'Postal and street address.',
  'Map pin for this company.',
  'Catalog tags for this company.',
  'Review your changes before saving.',
] as const

function contactPersonFromDetail(detail: CompanyDetail): CompanyWizardContactPerson | null {
  if (!detail.contactPerson) return null
  return {
    id: detail.contactPerson.id,
    displayName: detail.contactPerson.displayName,
    email: detail.contactPerson.email,
    avatarUrl: null,
  }
}

function valuesFromDetail(
  detail: CompanyDetail,
  fallbackContactPerson: CompanyWizardContactPerson | null,
): CompanyWizardFormValues {
  const phone = parsePhoneE164(detail.contactPhone, { fallbackIso2: defaultPhoneCountry() })
  return {
    name: detail.name,
    description: detail.description ?? '',
    companySize: (detail.companySize as CompanyWizardFormValues['companySize']) || '',
    contactPerson: contactPersonFromDetail(detail) ?? fallbackContactPerson,
    contactEmail: detail.contactEmail ?? '',
    phoneCountry: phone.iso2,
    phoneNational: phone.nationalNumber,
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
    tags: detail.tags ?? [],
  }
}

function emptyValues(contactPerson: CompanyWizardContactPerson | null): CompanyWizardFormValues {
  return {
    ...EMPTY_COMPANY_WIZARD_VALUES,
    phoneCountry: defaultPhoneCountry(),
    contactPerson,
  }
}

function toRegisterPayload(values: CompanyWizardFormValues): RegisterCompanyFormValues {
  const phone = contactPhoneFromValues(values.phoneCountry, values.phoneNational)
  return {
    name: values.name,
    description: values.description,
    companySize: values.companySize,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2,
    city: values.city,
    stateRegion: values.stateRegion,
    postalCode: values.postalCode,
    country: values.country,
    contactPersonUserId: values.contactPerson!.id,
    contactEmail: values.contactEmail,
    contactPhone: phone,
  }
}

function toUpdateBody(values: CompanyWizardFormValues): UpdateCompanyBody {
  const phone = contactPhoneFromValues(values.phoneCountry, values.phoneNational)
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    companySize: values.companySize || null,
    contactPersonUserId: values.contactPerson?.id ?? null,
    contactEmail: values.contactEmail.trim(),
    contactPhone: phone,
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim() || null,
    city: values.city.trim(),
    stateRegion: values.stateRegion.trim() || null,
    postalCode: values.postalCode.trim() || null,
    country: values.country.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
    mapPlaceId: values.mapPlaceId,
    mapFormattedAddress: values.mapFormattedAddress,
    tags: values.tags,
  }
}

export function CompanyFormDialog({
  open,
  id,
  initialStep = 1,
  detail,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  id?: string
  initialStep?: CompanyWizardStep
  detail?: CompanyDetail | null
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { user } = useSession()
  const { toast } = useToast()
  const isNew = !id
  const descriptions = isNew ? STEP_DESCRIPTIONS_CREATE : STEP_DESCRIPTIONS_EDIT
  const finalSubmitLabel = isNew ? 'Submit registration' : 'Save changes'

  const [step, setStep] = useState<CompanyWizardStep>(initialStep)
  const [values, setValues] = useState<CompanyWizardFormValues>(() =>
    emptyValues(contactPersonFromAuthUser(user)),
  )
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CompanyWizardFormValues | 'contactPhone' | 'contactPerson', string>>
  >({})
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadedDetail, setLoadedDetail] = useState<CompanyDetail | null>(detail ?? null)
  const [contactPersonPickerOpen, setContactPersonPickerOpen] = useState(false)
  const [contactPersonUsers, setContactPersonUsers] = useState<
    Awaited<ReturnType<typeof loadIdentityUsers>>['users']
  >([])

  const detailForForm = !isNew && loadedDetail && loadedDetail.id === id ? loadedDetail : null
  const showLoading = Boolean(!isNew && (loadingDetail || (!detailForForm && !loadError)))

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    setLoadError(null)
    setContactPersonPickerOpen(false)
    const defaultContactPerson = contactPersonFromAuthUser(user)
    if (isNew) {
      setLoadedDetail(null)
      setValues(emptyValues(defaultContactPerson))
      return
    }
    if (detail && detail.id === id) {
      setLoadedDetail(detail)
      setValues(valuesFromDetail(detail, defaultContactPerson))
      return
    }
    if (!id) return
    setLoadingDetail(true)
    void companyApi
      .getCompany(id)
      .then((next) => {
        setLoadedDetail(next)
        setValues(valuesFromDetail(next, defaultContactPerson))
      })
      .catch((err) => {
        setLoadedDetail(null)
        setLoadError(err instanceof Error ? err.message : 'Failed to load company')
      })
      .finally(() => setLoadingDetail(false))
  }, [open, initialStep, isNew, id, detail, user])

  const loadContactUsers = useCallback(async () => {
    try {
      const result = await loadIdentityUsers({ pageSize: 100 })
      setContactPersonUsers(result.users)
    } catch {
      setContactPersonUsers([])
    }
  }, [])

  useEffect(() => {
    if (!contactPersonPickerOpen) return
    void loadContactUsers()
  }, [contactPersonPickerOpen, loadContactUsers])

  function patchValues(patch: Partial<CompanyWizardFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
    if (patch.contactPerson !== undefined) {
      setFieldErrors((prev) => {
        if (!prev.contactPerson) return prev
        const next = { ...prev }
        delete next.contactPerson
        return next
      })
    }
  }

  function validateStep(current: CompanyWizardStep): boolean {
    const phone = contactPhoneFromValues(values.phoneCountry, values.phoneNational)

    if (current === 1) {
      const schema = isNew ? companyWizardCreateStep1Schema : companyProfileCardSchema
      const result = schema.safeParse({
        name: values.name,
        description: values.description,
        companySize: values.companySize,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 2) {
      const schema = isNew ? companyWizardCreateStep2Schema : companyContactCardSchema
      const result = schema.safeParse({
        contactPerson: values.contactPerson,
        contactEmail: values.contactEmail,
        contactPhone: phone,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 3) {
      const addressValues = {
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        stateRegion: values.stateRegion,
        postalCode: values.postalCode,
        country: values.country,
      }
      const schema = isNew ? companyWizardCreateStep3Schema : companyAddressCardSchema
      const result = schema.safeParse(addressValues)
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 4) {
      const locationValues = {
        latitude: values.latitude,
        longitude: values.longitude,
        mapPlaceId: values.mapPlaceId,
        mapFormattedAddress: values.mapFormattedAddress,
      }
      const schema = isNew ? companyWizardCreateStep4Schema : companyLocationCardSchema
      const result = schema.safeParse(locationValues)
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((prev) => Math.min(prev + 1, COMPANY_WIZARD_TOTAL_STEPS) as CompanyWizardStep)
  }

  function handlePrevious() {
    setFieldErrors({})
    setStep((prev) => Math.max(prev - 1, 1) as CompanyWizardStep)
  }

  async function handleSubmit() {
    if (isNew) {
      const payload = toRegisterPayload(values)
      const result = registerCompanyFormSchema.safeParse(payload)
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return
      }

      setBusy(true)
      try {
        const created = await companyApi.registerCompany(result.data)
        const newId = created.company.id
        if (values.tags.length > 0) {
          await companyApi.updateCompany(newId, toUpdateBody(values))
        }
        toast({ title: 'Registration submitted' })
        onOpenChange(false)
        onSaved?.()
      } catch (err) {
        toast({
          title: 'Could not register company',
          description: err instanceof Error ? err.message : undefined,
          variant: 'destructive',
        })
      } finally {
        setBusy(false)
      }
      return
    }

    if (!id) return
    for (const s of [1, 2, 3, 4] as const) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }

    setBusy(true)
    try {
      await companyApi.updateCompany(id, toUpdateBody(values))
      toast({ title: 'Company saved' })
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast({
        title: 'Could not save company',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  function handlePrimaryAction() {
    if (step < COMPANY_WIZARD_TOTAL_STEPS) {
      handleNext()
      return
    }
    void handleSubmit()
  }

  const stepIndex = step - 1
  const contactPhoneDisplay = contactPhoneFromValues(values.phoneCountry, values.phoneNational)
  const primaryLabel =
    step < COMPANY_WIZARD_TOTAL_STEPS
      ? 'Next'
      : busy
        ? isNew
          ? 'Submitting…'
          : 'Saving…'
        : finalSubmitLabel

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isNew ? 'Register company' : 'Edit company'}
        description={`Step ${step} of ${COMPANY_WIZARD_TOTAL_STEPS} — ${STEP_TITLES[stepIndex]}. ${descriptions[stepIndex]}`}
        sizeWidth="large"
        sizeHeight="xlarge"
        footer={
          <>
            {step > 1 ? (
              <Button variant="outline" disabled={busy || showLoading} onPress={handlePrevious}>
                Previous
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button loading={busy} disabled={showLoading} onPress={handlePrimaryAction}>
              {primaryLabel}
            </Button>
          </>
        }
      >
        <View className="gap-6">
          <View className="items-center gap-2">
            <Muted>
              Step {step} of {COMPANY_WIZARD_TOTAL_STEPS} — {STEP_TITLES[stepIndex]}
            </Muted>
            <CompanyWizardProgress
              currentStep={step}
              totalSteps={COMPANY_WIZARD_TOTAL_STEPS}
            />
          </View>

          {loadError ? <Body className="text-destructive">{loadError}</Body> : null}
          {showLoading ? <Spinner label="Loading company…" /> : null}

          {!showLoading && step === 1 ? (
            <CompanyWizardStepProfile
              values={values}
              fieldErrors={fieldErrors}
              isSubmitting={busy}
              requireAll={!isNew}
              onChange={patchValues}
            />
          ) : null}

          {!showLoading && step === 2 ? (
            <CompanyWizardStepContact
              values={values}
              fieldErrors={fieldErrors}
              isSubmitting={busy}
              requireAll={!isNew}
              onChange={patchValues}
              onOpenContactPersonPicker={() => setContactPersonPickerOpen(true)}
            />
          ) : null}

          {!showLoading && step === 3 ? (
            <CompanyWizardStepAddress
              values={values}
              fieldErrors={fieldErrors}
              isSubmitting={busy}
              requireAll={!isNew}
              onChange={patchValues}
            />
          ) : null}

          {!showLoading && step === 4 ? (
            <CompanyWizardStepLocation values={values} isSubmitting={busy} onChange={patchValues} />
          ) : null}

          {!showLoading && step === 5 ? (
            <CompanyWizardStepTags values={values} isSubmitting={busy} onChange={patchValues} />
          ) : null}

          {!showLoading && step === 6 ? (
            <CompanyWizardStepSummary
              values={values}
              isNew={isNew}
              contactPhoneDisplay={contactPhoneDisplay}
            />
          ) : null}
        </View>
      </CustomDialog>

      <UserSelectionDialog
        open={contactPersonPickerOpen}
        onOpenChange={setContactPersonPickerOpen}
        users={contactPersonUsers}
        selectedId={values.contactPerson?.id}
        title="Select contact person"
        onSelect={(selected) => {
          patchValues({
            contactPerson: {
              id: selected.id,
              displayName: selected.displayName,
              email: selected.email,
              avatarUrl: selected.avatarUrl,
            },
          })
        }}
      />
    </>
  )
}
