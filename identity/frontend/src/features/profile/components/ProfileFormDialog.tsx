import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { normalizeLocale } from '@webonone/i18n'
import type { MediaItemDto } from '@webonone/media-embed'
import {
  PLATFORM_EMBED_QUERY,
  resolvePlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  usePlatformPeerDialogSubmit,
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
  parsePhoneE164,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { changeAppLocale } from '@/features/shell/utils/changeAppLocale'
import {
  PROFILE_WIZARD_TOTAL_STEPS,
  profileFormToUpdateInput,
  profileSchema,
  profileWizardAddressSchema,
  profileWizardContactSchema,
  profileWizardNameSchema,
  type ProfileFormValues,
  type ProfileWizardStep,
  userToProfileFormValues,
} from '../schemas/profileSchemas'
import { ProfileMediaSelectorModal } from './ProfileMediaSelectorModal'
import { ProfileWizardProgress } from './profile-wizard/ProfileWizardProgress'
import { ProfileWizardStepAccount } from './profile-wizard/ProfileWizardStepAccount'
import { ProfileWizardStepAddress } from './profile-wizard/ProfileWizardStepAddress'
import { ProfileWizardStepContact } from './profile-wizard/ProfileWizardStepContact'
import { ProfileWizardStepName } from './profile-wizard/ProfileWizardStepName'
import { ProfileWizardStepSummary } from './profile-wizard/ProfileWizardStepSummary'

const PROFILE_WIZARD_DIALOG_SIZE = {
  sizeWidth: 'large' as const,
  sizeHeight: 'xlarge' as const,
}

const PROFILE_EDIT_EMBED_PATH = '/embed/dialogs/profile/edit'

export interface ProfileFormDialogProps {
  open: boolean
  initialStep?: ProfileWizardStep
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  chrome?: 'dialog' | 'embed-page'
}

export function ProfileFormDialog({
  open,
  initialStep = 1,
  onOpenChange,
  onSaved,
  chrome = 'dialog',
}: ProfileFormDialogProps) {
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const user = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const isProfileSaving = useAppSelector((s) => s.auth.isProfileSaving)
  const profileError = useAppSelector((s) => s.auth.profileError)
  const profileSaveSuccess = useAppSelector((s) => s.auth.profileSaveSuccess)

  const embedStep =
    chrome === 'embed-page'
      ? (() => {
          const n = Number(searchParams.get('step'))
          if (n === 2 || n === 3 || n === 4 || n === 5) return n as ProfileWizardStep
          return 1 as ProfileWizardStep
        })()
      : initialStep
  const stepQuery = embedStep > 1 ? `?step=${embedStep}` : ''
  const path = `${PROFILE_EDIT_EMBED_PATH}${stepQuery}`
  const dialogRequestId =
    chrome === 'embed-page'
      ? (searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? null)
      : null

  const STEP_TITLES = [
    t('wizard.steps.account'),
    t('wizard.steps.address'),
    t('wizard.steps.contact'),
    t('wizard.steps.name'),
    t('wizard.steps.summary'),
  ] as const

  const STEP_DESCRIPTIONS = [
    t('wizard.descriptions.account'),
    t('wizard.descriptions.address'),
    t('wizard.descriptions.contact'),
    t('wizard.descriptions.name'),
    t('wizard.descriptions.summary'),
  ] as const

  const title = t('editProfile')
  const finalSubmitLabel = t('saveChanges')

  const [step, setStep] = useState<ProfileWizardStep>(embedStep)
  const [values, setValues] = useState<ProfileFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>(
    {},
  )
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorOpenKey, setSelectorOpenKey] = useState(0)
  const [blockOuterDismiss, setBlockOuterDismiss] = useState(false)
  const submittedRef = useRef(false)
  const seededUserIdRef = useRef<string | null>(null)
  const selectorOpenRef = useRef(false)
  const blockOuterDismissRef = useRef(false)
  const blockTimerRef = useRef<number | null>(null)

  const primaryLabelForStep = (current: ProfileWizardStep, saving: boolean) => {
    if (saving) return t('saving')
    if (current < PROFILE_WIZARD_TOTAL_STEPS) return tc('next')
    return finalSubmitLabel
  }

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin: chrome === 'dialog' ? parentOrigin : null,
    open: chrome === 'dialog' && open,
    path,
    title,
    description: STEP_DESCRIPTIONS[embedStep - 1],
    submitLabel: primaryLabelForStep(embedStep, false),
    secondaryLabel: embedStep > 1 ? tc('previous') : undefined,
    ...PROFILE_WIZARD_DIALOG_SIZE,
    onResult: () => {
      onSaved()
      onOpenChange(false)
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    selectorOpenRef.current = selectorOpen
  }, [selectorOpen])

  useEffect(() => {
    return () => {
      if (blockTimerRef.current !== null) {
        window.clearTimeout(blockTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open && chrome === 'dialog') return
    const nextStep = chrome === 'embed-page' ? embedStep : initialStep
    setStep(nextStep)
    setFieldErrors({})
    seededUserIdRef.current = null
    setPendingAvatarUrl(null)
    setSelectorOpen(false)
    setBlockOuterDismiss(false)
  }, [chrome, embedStep, initialStep, open])

  useEffect(() => {
    if ((!open && chrome === 'dialog') || !user) return
    if (seededUserIdRef.current === user.id) return
    seededUserIdRef.current = user.id
    setValues(userToProfileFormValues(user))
    const parsed = parsePhoneE164(user.phoneNumber, {
      fallbackIso2: getBrowserDefaultCountryIso2(),
      preferIso2: user.country ?? undefined,
    })
    setPhoneCountry(parsed.iso2)
    setPhoneNational(parsed.nationalNumber)
  }, [chrome, open, user])

  useEffect(() => {
    if (!submittedRef.current || isProfileSaving) return
    submittedRef.current = false
    if (!profileError) {
      const nextLocale = values?.locale
      if (nextLocale) {
        void changeAppLocale(normalizeLocale(nextLocale))
      }
      onSaved()
      if (chrome === 'dialog') {
        onOpenChange(false)
      }
    }
  }, [chrome, isProfileSaving, onOpenChange, onSaved, profileError, values?.locale])

  useEffect(() => {
    if (profileSaveSuccess) {
      const timer = window.setTimeout(() => {
        dispatch(authActions.clearProfileSaveSuccess())
      }, 3000)
      return () => window.clearTimeout(timer)
    }
  }, [profileSaveSuccess, dispatch])

  const closeMediaSelector = useCallback(() => {
    setSelectorOpen(false)
    selectorOpenRef.current = false
    blockOuterDismissRef.current = true
    setBlockOuterDismiss(true)
    if (blockTimerRef.current !== null) {
      window.clearTimeout(blockTimerRef.current)
    }
    blockTimerRef.current = window.setTimeout(() => {
      blockOuterDismissRef.current = false
      setBlockOuterDismiss(false)
      blockTimerRef.current = null
    }, 150)
  }, [])

  const openMediaSelector = useCallback(() => {
    if (!accessToken) return
    setSelectorOpenKey((key) => key + 1)
    selectorOpenRef.current = true
    setSelectorOpen(true)
  }, [accessToken])

  function patchValues(patch: Partial<ProfileFormValues>) {
    setValues((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function contactPhoneFromState(): string | null {
    return phoneNational.trim() ? formatPhoneE164(phoneCountry, phoneNational) : null
  }

  function validateStep(current: ProfileWizardStep): boolean {
    if (!values) return false

    if (current === 1) {
      setFieldErrors({})
      return true
    }

    if (current === 2) {
      const result = profileWizardAddressSchema.safeParse({
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        stateRegion: values.stateRegion,
        postalCode: values.postalCode,
        country: values.country,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 3) {
      const result = profileWizardContactSchema.safeParse({
        phoneNumber: contactPhoneFromState(),
        locale: values.locale,
      })
      if (!result.success) {
        setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
        return false
      }
      setFieldErrors({})
      return true
    }

    if (current === 4) {
      const result = profileWizardNameSchema.safeParse({
        firstName: values.firstName,
        lastName: values.lastName,
        displayName: values.displayName,
      })
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
    setStep((prev) => Math.min(prev + 1, PROFILE_WIZARD_TOTAL_STEPS) as ProfileWizardStep)
  }

  function handlePrevious() {
    setFieldErrors({})
    setStep((prev) => Math.max(prev - 1, 1) as ProfileWizardStep)
  }

  function handleSubmit() {
    if (!values || !accessToken) return

    for (const s of [2, 3, 4] as const) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }

    const phoneNumber = contactPhoneFromState()
    const parsed = profileSchema.safeParse({ ...values, phoneNumber })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    submittedRef.current = true
    dispatch(
      authActions.profileUpdateRequested({
        body: {
          ...profileFormToUpdateInput(parsed.data),
          ...(pendingAvatarUrl !== null ? { avatarUrl: pendingAvatarUrl } : {}),
        },
      }),
    )
  }

  function handlePrimaryAction() {
    if (step < PROFILE_WIZARD_TOTAL_STEPS) {
      handleNext()
      return
    }
    handleSubmit()
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: chrome === 'embed-page' ? parentOrigin : null,
    requestId: dialogRequestId,
    onSubmit: () => {
      if (selectorOpenRef.current) return
      handlePrimaryAction()
    },
    onSecondary: () => {
      if (selectorOpenRef.current || isProfileSaving) return
      handlePrevious()
    },
  })

  useEffect(() => {
    if (chrome !== 'embed-page' || !parentOrigin || !dialogRequestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      dialogRequestId,
      isProfileSaving || selectorOpen,
      primaryLabelForStep(step, isProfileSaving),
      {
        description: STEP_DESCRIPTIONS[step - 1],
        secondaryLabel: step > 1 ? tc('previous') : null,
      },
    )
  }, [chrome, dialogRequestId, isProfileSaving, parentOrigin, selectorOpen, step])

  function handleFormOpenChange(next: boolean) {
    if (next) return
    if (selectorOpenRef.current || selectorOpen) {
      closeMediaSelector()
      return
    }
    if (blockOuterDismissRef.current || blockOuterDismiss) {
      return
    }
    onOpenChange(false)
  }

  function handleMediaSelect(items: MediaItemDto[]) {
    const item = items[0]
    if (item) {
      setPendingAvatarUrl(item.url)
      closeMediaSelector()
    }
  }

  if (!user || !values) {
    if (chrome === 'embed-page') {
      return (
        <div className="flex min-h-[200px] items-center justify-center p-6 text-sm text-muted-foreground">
          {t('loading')}
        </div>
      )
    }
    return null
  }

  const stepIndex = step - 1
  const displayAvatarUrl = pendingAvatarUrl ?? user.avatarUrl
  const phoneDisplay = contactPhoneFromState() ?? ''

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={() => handleFormOpenChange(false)}
        disabled={isProfileSaving}
      >
        {tc('cancel')}
      </Button>
      {step > 1 ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
          onClick={handlePrevious}
          disabled={isProfileSaving}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {tc('previous')}
        </Button>
      ) : null}
      {step < PROFILE_WIZARD_TOTAL_STEPS ? (
        <Button
          type="button"
          className="h-10 px-4"
          onClick={handleNext}
          disabled={isProfileSaving || selectorOpen}
        >
          {tc('next')}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          className="h-10"
          onClick={handleSubmit}
          disabled={isProfileSaving || selectorOpen}
        >
          <Save className="mr-2 h-4 w-4" />
          {isProfileSaving ? t('saving') : finalSubmitLabel}
        </Button>
      )}
    </div>
  )

  const body = (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('stepOf', {
            current: step,
            total: PROFILE_WIZARD_TOTAL_STEPS,
            title: STEP_TITLES[stepIndex],
          })}
        </p>
        <ProfileWizardProgress currentStep={step} totalSteps={PROFILE_WIZARD_TOTAL_STEPS} />
      </div>

      {profileError ? (
        <Alert variant="destructive">
          <AlertDescription>{profileError}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <ProfileWizardStepAccount
          displayName={values.displayName || user.displayName}
          email={user.email ?? ''}
          avatarUrl={displayAvatarUrl}
          isGoogleUser={user.isGoogleUser}
          isSubmitting={isProfileSaving}
          onEditImage={openMediaSelector}
        />
      ) : null}

      {step === 2 ? (
        <ProfileWizardStepAddress
          values={values}
          fieldErrors={fieldErrors}
          isSubmitting={isProfileSaving}
          onChange={patchValues}
        />
      ) : null}

      {step === 3 ? (
        <ProfileWizardStepContact
          values={values}
          phoneCountry={phoneCountry}
          phoneNational={phoneNational}
          fieldErrors={fieldErrors}
          isSubmitting={isProfileSaving}
          onChange={patchValues}
          onPhoneCountryChange={(country) => setPhoneCountry(country.iso2)}
          onPhoneNationalChange={setPhoneNational}
        />
      ) : null}

      {step === 4 ? (
        <ProfileWizardStepName
          values={values}
          fieldErrors={fieldErrors}
          isSubmitting={isProfileSaving}
          onChange={patchValues}
        />
      ) : null}

      {step === 5 ? (
        <ProfileWizardStepSummary
          values={values}
          phoneDisplay={phoneDisplay}
          email={user.email ?? ''}
          avatarUrl={pendingAvatarUrl}
        />
      ) : null}
    </div>
  )

  const mediaModal = (
    <ProfileMediaSelectorModal
      isOpen={selectorOpen}
      accessToken={accessToken}
      userId={user.id}
      openKey={selectorOpenKey}
      onSelect={handleMediaSelect}
      onClose={closeMediaSelector}
    />
  )

  if (chrome === 'embed-page') {
    return (
      <>
        <div className="flex w-full flex-col gap-4 p-4 sm:p-6">{body}</div>
        {mediaModal}
      </>
    )
  }

  if (isHosted) {
    return null
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={handleFormOpenChange}
        title={title}
        description={STEP_DESCRIPTIONS[stepIndex]}
        sizeWidth={PROFILE_WIZARD_DIALOG_SIZE.sizeWidth}
        sizeHeight={PROFILE_WIZARD_DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={selectorOpen || blockOuterDismiss}
        footer={footer}
      >
        {body}
      </CustomDialog>
      {mediaModal}
    </>
  )
}
