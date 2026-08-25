import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  cn,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
  parsePhoneE164,
  UserSelectionDialog,
  type LoadUsersFn,
  type UserOption,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
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
  registerCompanyFormSchema,
  type CompanyWizardContactPerson,
  type CompanyWizardFormValues,
  type CompanyWizardStep,
  type RegisterCompanyFormValues,
} from '@/features/settings/basic/schemas/companySchemas'
import type {
  CompanyDetail,
  UpdateCompanyBody,
} from '@/features/settings/basic/services/companyApi'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'
import { CompanyWizardProgress } from './company-wizard/CompanyWizardProgress'
import { CompanyWizardStepAddress } from './company-wizard/CompanyWizardStepAddress'
import { CompanyWizardStepContact } from './company-wizard/CompanyWizardStepContact'
import { CompanyWizardStepLocation } from './company-wizard/CompanyWizardStepLocation'
import { CompanyWizardStepProfile } from './company-wizard/CompanyWizardStepProfile'
import { CompanyWizardStepSummary } from './company-wizard/CompanyWizardStepSummary'
import { CompanyWizardStepTags } from './company-wizard/CompanyWizardStepTags'

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

const EMPTY_EXCLUDE = new Set<string>()

function toWizardContactPerson(user: UserOption): CompanyWizardContactPerson {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
  }
}

function contactPersonFromDetail(detail: CompanyDetail): CompanyWizardContactPerson | null {
  if (detail.contactPerson) {
    return {
      id: detail.contactPerson.id,
      displayName: detail.contactPerson.displayName,
      email: detail.contactPerson.email,
      avatarUrl: null,
    }
  }
  return null
}

function valuesFromDetail(
  detail: CompanyDetail,
  fallbackContactPerson: CompanyWizardContactPerson | null,
): CompanyWizardFormValues {
  const phone = parsePhoneE164(detail.contactPhone, {
    fallbackIso2: getBrowserDefaultCountryIso2(),
  })
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

function emptyValues(): CompanyWizardFormValues {
  return {
    ...EMPTY_COMPANY_WIZARD_VALUES,
    phoneCountry: getBrowserDefaultCountryIso2(),
  }
}

function contactPhoneFromValues(values: CompanyWizardFormValues): string {
  return formatPhoneE164(values.phoneCountry, values.phoneNational) || values.phoneNational.trim()
}

function toRegisterPayload(values: CompanyWizardFormValues): RegisterCompanyFormValues {
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
    contactPhone: contactPhoneFromValues(values),
  }
}

function toUpdateBody(values: CompanyWizardFormValues): UpdateCompanyBody {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    companySize: values.companySize || null,
    contactPersonUserId: values.contactPerson?.id ?? null,
    contactEmail: values.contactEmail.trim(),
    contactPhone: contactPhoneFromValues(values),
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

export interface CompanyFormDialogProps {
  open: boolean
  id?: string
  initialStep?: CompanyWizardStep
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function CompanyFormDialog({
  open,
  id,
  initialStep = 1,
  onOpenChange,
  onSaved,
}: CompanyFormDialogProps) {
  const dispatch = useAppDispatch()
  const isNew = !id
  const title = isNew ? 'Register company' : 'Edit company'
  const finalSubmitLabel = isNew ? 'Submit registration' : 'Save changes'
  const descriptions = isNew ? STEP_DESCRIPTIONS_CREATE : STEP_DESCRIPTIONS_EDIT

  const myCompany = useAppSelector((s) => s.companies.myCompany)
  const detail = useAppSelector((s) => s.companies.detail)
  const detailStatus = useAppSelector((s) => s.companies.detailStatus)
  const detailError = useAppSelector((s) => s.companies.detailError)
  const myCompanyStatus = useAppSelector((s) => s.companies.myCompanyStatus)
  const myCompanyError = useAppSelector((s) => s.companies.myCompanyError)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const authUser = useAppSelector((s) => s.auth.user)

  const [step, setStep] = useState<CompanyWizardStep>(initialStep)
  const [values, setValues] = useState<CompanyWizardFormValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CompanyWizardFormValues | 'contactPhone' | 'contactPerson', string>>
  >({})
  const [nestedOpen, setNestedOpen] = useState(false)
  const [contactPersonPickerOpen, setContactPersonPickerOpen] = useState(false)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'register' | 'update-after-register'>('idle')
  const submittedRef = useRef(false)
  const seededDetailIdRef = useRef<string | null>(null)
  const blockTimerRef = useRef<number | null>(null)

  const saving =
    phase === 'update-after-register'
      ? detailStatus === 'saving'
      : isNew
        ? myCompanyStatus === 'saving'
        : detailStatus === 'saving'
  const error =
    phase === 'update-after-register'
      ? detailError
      : isNew
        ? myCompanyError
        : detailError
  const detailForForm = !isNew && detail && detail.id === id ? detail : null
  const showLoading = Boolean(!isNew && detailStatus === 'loading' && !detailForForm)

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setFieldErrors({})
    seededDetailIdRef.current = null
    setPhase('idle')
    submittedRef.current = false
    setNestedOpen(false)
    setContactPersonPickerOpen(false)
    setBlockOuterDismiss(false)
    const defaultContactPerson = contactPersonFromAuthUser(authUser)
    if (isNew) {
      setValues({
        ...emptyValues(),
        contactPerson: defaultContactPerson,
      })
    }
  }, [open, initialStep, isNew, authUser])

  useEffect(() => {
    if (!open || isNew || !id) return
    if (detail?.id === id) return
    dispatch(companiesActions.loadCompanyDetailRequested({ id }))
  }, [open, isNew, id, detail?.id, dispatch])

  useEffect(() => {
    if (!open || isNew || !detailForForm) return
    if (seededDetailIdRef.current === detailForForm.id) return
    seededDetailIdRef.current = detailForForm.id
    setValues(valuesFromDetail(detailForForm, contactPersonFromAuthUser(authUser)))
  }, [detailForForm, isNew, open, authUser])

  useEffect(() => {
    if (!submittedRef.current) return
    if (saving) return

    if (error) {
      submittedRef.current = false
      setPhase('idle')
      return
    }

    if (phase === 'register') {
      const newId = myCompany?.company.id
      if (newId && values.tags.length > 0) {
        setPhase('update-after-register')
        dispatch(
          companiesActions.updateCompanyDetailRequested({
            id: newId,
            body: toUpdateBody(values),
          }),
        )
        return
      }
      submittedRef.current = false
      setPhase('idle')
      onSaved()
      onOpenChange(false)
      return
    }

    if (phase === 'update-after-register' || phase === 'idle') {
      submittedRef.current = false
      setPhase('idle')
      onSaved()
      onOpenChange(false)
    }
  }, [
    saving,
    error,
    phase,
    myCompany?.company.id,
    values,
    dispatch,
    onSaved,
    onOpenChange,
  ])

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

  const loadContactPersonUsers: LoadUsersFn = useCallback(
    async (params) => {
      if (!accessToken) {
        return { users: [], hasMore: false }
      }
      return loadIdentityUsersForStaff(accessToken, params, EMPTY_EXCLUDE)
    },
    [accessToken],
  )

  function handleNestedOpenChange(openNested: boolean) {
    setNestedOpen(openNested)
    if (!openNested) {
      setBlockOuterDismiss(true)
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
      blockTimerRef.current = window.setTimeout(() => {
        setBlockOuterDismiss(false)
        blockTimerRef.current = null
      }, 150)
    }
  }

  function validateStep(current: CompanyWizardStep): boolean {
    const phone = contactPhoneFromValues(values)

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

  function handleSubmit() {
    if (isNew) {
      const payload = toRegisterPayload(values)
      const result = registerCompanyFormSchema.safeParse(payload)
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return
      }
      setFieldErrors({})
      setPhase('register')
      submittedRef.current = true
      dispatch(companiesActions.registerCompanyRequested(result.data))
      return
    }

    if (!id) return
    for (const s of [1, 2, 3, 4] as const) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }
    setFieldErrors({})
    setPhase('idle')
    submittedRef.current = true
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id,
        body: toUpdateBody(values),
      }),
    )
  }

  function handleOpenChange(next: boolean) {
    if (!next && (nestedOpen || contactPersonPickerOpen || blockOuterDismiss)) {
      return
    }
    onOpenChange(next)
  }

  const stepIndex = step - 1
  const contactPhoneDisplay = contactPhoneFromValues(values)
  const isLocationStep = step === 4

  return (
    <>
    <CustomDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={descriptions[stepIndex]}
      sizeWidth="large"
      sizeHeight="xlarge"
      nestedDismissGuard={nestedOpen || contactPersonPickerOpen || blockOuterDismiss}
      disableContentScroll={isLocationStep}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={handlePrevious}
              disabled={saving || showLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          ) : null}
          {step < COMPANY_WIZARD_TOTAL_STEPS ? (
            <Button
              type="button"
              className="h-10 px-4"
              onClick={handleNext}
              disabled={saving || showLoading}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10"
              onClick={handleSubmit}
              disabled={saving || showLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? (isNew ? 'Submitting…' : 'Saving…') : finalSubmitLabel}
            </Button>
          )}
        </div>
      }
    >
      <div
        className={cn(
          isLocationStep ? 'flex h-full min-h-0 flex-col gap-6' : 'space-y-6',
        )}
      >
        <div className="shrink-0 space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step} of {COMPANY_WIZARD_TOTAL_STEPS} — {STEP_TITLES[stepIndex]}
          </p>
          <CompanyWizardProgress
            currentStep={step}
            totalSteps={COMPANY_WIZARD_TOTAL_STEPS}
          />
        </div>

        {error ? (
          <Alert variant="destructive" className="shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {showLoading ? (
          <p className="text-sm text-muted-foreground">Loading company…</p>
        ) : null}

        {!showLoading && step === 1 ? (
          <CompanyWizardStepProfile
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={saving}
            requireAll={!isNew}
            onChange={patchValues}
          />
        ) : null}

        {!showLoading && step === 2 ? (
          <CompanyWizardStepContact
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={saving}
            requireAll={!isNew}
            onChange={patchValues}
            onOpenContactPersonPicker={() => setContactPersonPickerOpen(true)}
          />
        ) : null}

        {!showLoading && step === 3 ? (
          <CompanyWizardStepAddress
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={saving}
            requireAll={!isNew}
            onChange={patchValues}
          />
        ) : null}

        {!showLoading && isLocationStep ? (
          <div className="min-h-0 flex-1">
            <CompanyWizardStepLocation
              values={values}
              isSubmitting={saving}
              onChange={patchValues}
            />
          </div>
        ) : null}

        {!showLoading && step === 5 ? (
          <CompanyWizardStepTags
            values={values}
            isSubmitting={saving}
            onChange={patchValues}
            onNestedOpenChange={handleNestedOpenChange}
          />
        ) : null}

        {!showLoading && step === 6 ? (
          <CompanyWizardStepSummary
            values={values}
            isNew={isNew}
            contactPhoneDisplay={contactPhoneDisplay}
          />
        ) : null}
      </div>
    </CustomDialog>

    <UserSelectionDialog
      open={contactPersonPickerOpen}
      onOpenChange={setContactPersonPickerOpen}
      onSelect={(user) => {
        patchValues({ contactPerson: toWizardContactPerson(user) })
        setContactPersonPickerOpen(false)
      }}
      loadUsers={loadContactPersonUsers}
      title="Select contact person"
      description="Choose who represents this company for platform contact."
    />
    </>
  )
}
