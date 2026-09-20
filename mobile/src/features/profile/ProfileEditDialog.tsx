import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  ImagePreview,
  Body,
  Button,
  CustomDialog,
  Muted,
  Subheading,
  TextField,
  useToast,
} from '@webonone/mobile-ui'
import { authApi, type IdentityProfile } from '@/features/auth/authApi'
import {
  PROFILE_WIZARD_TOTAL_STEPS,
  mapZodIssuesToFieldErrors,
  profileFormToUpdateInput,
  profileSchema,
  profileWizardAddressSchema,
  profileWizardContactSchema,
  profileWizardNameSchema,
  type ProfileFormValues,
  type ProfileWizardStep,
  userToProfileFormValues,
} from '@/features/profile/profileSchemas'

const STEP_TITLES: Record<ProfileWizardStep, string> = {
  1: 'Account',
  2: 'Address',
  3: 'Contact',
  4: 'Name',
  5: 'Review & save',
}

const STEP_DESCRIPTIONS: Record<ProfileWizardStep, string> = {
  1: 'Your sign-in email and profile photo.',
  2: 'Where you are located.',
  3: 'Phone number and preferred language.',
  4: 'How your name appears across the platform.',
  5: 'Confirm your changes before saving.',
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function LocalePicker({
  value,
  disabled,
  onChange,
}: {
  value: 'en' | 'si' | null
  disabled?: boolean
  onChange: (locale: 'en' | 'si') => void
}) {
  const options: { id: 'en' | 'si'; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'si', label: 'සිංහල' },
  ]

  return (
    <View className="gap-2">
      <Body className="text-sm font-medium">Language</Body>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const selected = value === option.id
          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              onPress={() => onChange(option.id)}
              className={`flex-1 rounded-lg border px-3 py-3 ${
                selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <Body className={`text-center text-sm ${selected ? 'font-semibold text-primary' : ''}`}>
                {option.label}
              </Body>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function StepAccount({ profile }: { profile: IdentityProfile }) {
  return (
    <View className="items-center gap-4">
      <ImagePreview
        src={profile.avatarUrl}
        alt={profile.displayName}
        className="h-40 w-40"
      />
      <View className="items-center gap-1">
        <Subheading>{profile.displayName}</Subheading>
        <Muted>{dash(profile.email)}</Muted>
      </View>
      {profile.isGoogleUser ? (
        <Muted className="text-center">Signed in with Google. Some details are managed by Google.</Muted>
      ) : null}
      <Muted className="text-center text-xs">
        Profile photo changes are available on the web app for now.
      </Muted>
    </View>
  )
}

function StepAddress({
  values,
  fieldErrors,
  disabled,
  onChange,
}: {
  values: ProfileFormValues
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  disabled?: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
}) {
  return (
    <View className="gap-3">
      <TextField
        label="Address line 1"
        value={values.addressLine1 ?? ''}
        onChangeText={(text) => onChange({ addressLine1: text || null })}
        editable={!disabled}
        error={fieldErrors.addressLine1}
      />
      <TextField
        label="Address line 2"
        value={values.addressLine2 ?? ''}
        onChangeText={(text) => onChange({ addressLine2: text || null })}
        editable={!disabled}
        error={fieldErrors.addressLine2}
      />
      <TextField
        label="City"
        value={values.city ?? ''}
        onChangeText={(text) => onChange({ city: text || null })}
        editable={!disabled}
        error={fieldErrors.city}
      />
      <TextField
        label="State / region"
        value={values.stateRegion ?? ''}
        onChangeText={(text) => onChange({ stateRegion: text || null })}
        editable={!disabled}
        error={fieldErrors.stateRegion}
      />
      <TextField
        label="Postal code"
        value={values.postalCode ?? ''}
        onChangeText={(text) => onChange({ postalCode: text || null })}
        editable={!disabled}
        error={fieldErrors.postalCode}
      />
      <TextField
        label="Country"
        value={values.country}
        onChangeText={(text) => onChange({ country: text.toUpperCase().slice(0, 2) })}
        editable={!disabled}
        autoCapitalize="characters"
        hint="2-letter code, e.g. LK"
        error={fieldErrors.country}
      />
    </View>
  )
}

function StepContact({
  values,
  fieldErrors,
  disabled,
  onChange,
}: {
  values: ProfileFormValues
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  disabled?: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
}) {
  return (
    <View className="gap-3">
      <TextField
        label="Phone number"
        value={values.phoneNumber ?? ''}
        onChangeText={(text) => onChange({ phoneNumber: text.trim() || null })}
        editable={!disabled}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+94771234567"
        hint="International format with country code"
        error={fieldErrors.phoneNumber}
      />
      <LocalePicker
        value={values.locale}
        disabled={disabled}
        onChange={(locale) => onChange({ locale })}
      />
      {fieldErrors.locale ? <Body className="text-xs text-destructive">{fieldErrors.locale}</Body> : null}
    </View>
  )
}

function StepName({
  values,
  fieldErrors,
  disabled,
  onChange,
}: {
  values: ProfileFormValues
  fieldErrors: Partial<Record<keyof ProfileFormValues, string>>
  disabled?: boolean
  onChange: (patch: Partial<ProfileFormValues>) => void
}) {
  return (
    <View className="gap-3">
      <TextField
        label="First name"
        required
        value={values.firstName}
        onChangeText={(text) => onChange({ firstName: text })}
        editable={!disabled}
        error={fieldErrors.firstName}
      />
      <TextField
        label="Last name"
        required
        value={values.lastName}
        onChangeText={(text) => onChange({ lastName: text })}
        editable={!disabled}
        error={fieldErrors.lastName}
      />
      <TextField
        label="Display name"
        required
        value={values.displayName}
        onChangeText={(text) => onChange({ displayName: text })}
        editable={!disabled}
        error={fieldErrors.displayName}
      />
    </View>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Muted className="shrink-0">{label}</Muted>
      <Body className="flex-1 text-right">{value || '—'}</Body>
    </View>
  )
}

function StepSummary({
  values,
  email,
}: {
  values: ProfileFormValues
  email: string | null
}) {
  const localeLabel = values.locale === 'si' ? 'සිංහල' : values.locale === 'en' ? 'English' : '—'

  return (
    <View className="gap-4 rounded-lg border border-border bg-card p-4">
      <Subheading>{values.displayName || '—'}</Subheading>
      <Muted>{dash(email)}</Muted>
      <View className="gap-2 border-t border-border pt-3">
        <SummaryRow label="Phone" value={dash(values.phoneNumber)} />
        <SummaryRow label="Language" value={localeLabel} />
        <SummaryRow label="Address" value={dash(values.addressLine1)} />
        <SummaryRow label="City" value={dash(values.city)} />
        <SummaryRow label="Country" value={values.country ? values.country.toUpperCase() : '—'} />
        <SummaryRow label="First name" value={values.firstName} />
        <SummaryRow label="Last name" value={values.lastName} />
      </View>
    </View>
  )
}

export function ProfileEditDialog({
  open,
  initialStep = 1,
  profile,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  initialStep?: ProfileWizardStep
  profile: IdentityProfile
  onOpenChange: (open: boolean) => void
  onSaved: (profile: IdentityProfile) => void
}) {
  const { toast } = useToast()
  const [step, setStep] = useState<ProfileWizardStep>(initialStep)
  const [values, setValues] = useState<ProfileFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(initialStep)
    setValues(userToProfileFormValues(profile))
    setFieldErrors({})
    setSaveError(null)
  }, [open, initialStep, profile])

  function patchValues(patch: Partial<ProfileFormValues>) {
    setValues((prev) => (prev ? { ...prev, ...patch } : prev))
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
        phoneNumber: values.phoneNumber,
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

  async function handleSubmit() {
    if (!values) return

    for (const s of [2, 3, 4] as const) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }

    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const updated = await authApi.patchIdentityMe(profileFormToUpdateInput(parsed.data))
      toast({ title: 'Profile saved' })
      onSaved(updated)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save profile'
      setSaveError(message)
      toast({ title: 'Could not save profile', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function handlePrimaryAction() {
    if (step < PROFILE_WIZARD_TOTAL_STEPS) {
      handleNext()
      return
    }
    void handleSubmit()
  }

  const primaryLabel =
    step < PROFILE_WIZARD_TOTAL_STEPS ? 'Next' : saving ? 'Saving…' : 'Save profile'

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      id="profile-edit-dialog"
      title={`Edit profile — ${STEP_TITLES[step]}`}
      description={`Step ${step} of ${PROFILE_WIZARD_TOTAL_STEPS}. ${STEP_DESCRIPTIONS[step]}`}
      sizeWidth="large"
      sizeHeight="xlarge"
      footer={
        <>
          {step > 1 ? (
            <Button variant="outline" disabled={saving} onPress={handlePrevious}>
              Previous
            </Button>
          ) : (
            <Button variant="outline" disabled={saving} onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button loading={saving} onPress={handlePrimaryAction}>
            {primaryLabel}
          </Button>
        </>
      }
    >
      <Muted>
        Step {step} of {PROFILE_WIZARD_TOTAL_STEPS}
      </Muted>
      {saveError ? <Body className="text-destructive">{saveError}</Body> : null}
      {!values ? null : step === 1 ? (
        <StepAccount profile={profile} />
      ) : step === 2 ? (
        <StepAddress
          values={values}
          fieldErrors={fieldErrors}
          disabled={saving}
          onChange={patchValues}
        />
      ) : step === 3 ? (
        <StepContact
          values={values}
          fieldErrors={fieldErrors}
          disabled={saving}
          onChange={patchValues}
        />
      ) : step === 4 ? (
        <StepName
          values={values}
          fieldErrors={fieldErrors}
          disabled={saving}
          onChange={patchValues}
        />
      ) : (
        <StepSummary values={values} email={profile.email} />
      )}
    </CustomDialog>
  )
}
