import { useEffect, useState } from 'react'
import { Globe, MapPin, User } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Avatar,
  Button,
  Form,
  FormField,
  Input,
  InputGroup,
  InputGroupIcon,
  PhoneInput,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
  parsePhoneE164,
  Spinner,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import type { UserProfile } from '@/features/auth/types/auth.types'
import { authActions } from '@/features/auth/store'
import {
  profileFormToUpdateInput,
  profileSchema,
  type ProfileFormValues,
  userToProfileFormValues,
} from '../schemas/profileSchemas'

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

interface ProfileFormProps {
  user: UserProfile
}

export function ProfileForm({ user }: ProfileFormProps) {
  const dispatch = useAppDispatch()
  const { isProfileSaving, profileError, profileSaveSuccess, accessToken } = useAppSelector(
    (s) => s.auth,
  )
  const [values, setValues] = useState<ProfileFormValues>(() => userToProfileFormValues(user))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>(
    {},
  )
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')

  useEffect(() => {
    setValues(userToProfileFormValues(user))
    const parsed = parsePhoneE164(user.phoneNumber, {
      fallbackIso2: getBrowserDefaultCountryIso2(),
      preferIso2: user.country ?? undefined,
    })
    setPhoneCountry(parsed.iso2)
    setPhoneNational(parsed.nationalNumber)
  }, [user])

  useEffect(() => {
    if (profileSaveSuccess) {
      const timer = window.setTimeout(() => {
        dispatch(authActions.clearProfileSaveSuccess())
      }, 3000)
      return () => window.clearTimeout(timer)
    }
  }, [profileSaveSuccess, dispatch])

  function handleChange<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const phoneNumber = phoneNational.trim()
      ? formatPhoneE164(phoneCountry, phoneNational)
      : null
    const parsed = profileSchema.safeParse({ ...values, phoneNumber })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    if (!accessToken) return
    dispatch(
      authActions.profileUpdateRequested({
        accessToken,
        body: profileFormToUpdateInput(parsed.data),
      }),
    )
  }

  return (
    <Form onSubmit={handleSubmit} className="space-y-8">
      {profileError ? (
        <Alert variant="destructive">
          <AlertDescription>{profileError}</AlertDescription>
        </Alert>
      ) : null}
      {profileSaveSuccess ? (
        <Alert>
          <AlertDescription>Profile saved successfully.</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="flex items-center gap-4">
          <Avatar
            size="lg"
            src={user.avatarUrl}
            alt={user.displayName}
            fallback={getInitials(user.displayName)}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {user.isEmailVerified ? <span>Email verified</span> : null}
              {user.isGoogleUser ? <span>Signed in with Google</span> : null}
            </div>
          </div>
        </div>
        {user.isGoogleUser ? (
          <p className="text-sm text-muted-foreground">
            Name and photo were imported from Google. Add your phone and address below.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Name</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="firstName" required error={fieldErrors.firstName}>
            <InputGroup>
              <InputGroupIcon icon={User} />
              <Input
                id="firstName"
                inGroup
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
            </InputGroup>
          </FormField>
          <FormField label="Last name" htmlFor="lastName" required error={fieldErrors.lastName}>
            <InputGroup>
              <InputGroupIcon icon={User} />
              <Input
                id="lastName"
                inGroup
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </InputGroup>
          </FormField>
        </div>
        <FormField label="Display name" htmlFor="displayName" required error={fieldErrors.displayName}>
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="displayName"
              inGroup
              autoComplete="name"
              value={values.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
            />
          </InputGroup>
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <FormField label="Phone number" htmlFor="phoneNumber" error={fieldErrors.phoneNumber}>
          <PhoneInput
            id="phoneNumber"
            withIcon
            country={phoneCountry}
            onCountryChange={(next) => setPhoneCountry(next.iso2)}
            autoComplete="tel"
            placeholder="555-0100"
            value={phoneNational}
            onChange={(e) => setPhoneNational(e.target.value)}
          />
        </FormField>
        <FormField label="Locale" htmlFor="locale" error={fieldErrors.locale}>
          <InputGroup>
            <InputGroupIcon icon={Globe} />
            <Input
              id="locale"
              inGroup
              placeholder="en-US"
              value={values.locale ?? ''}
              onChange={(e) => handleChange('locale', e.target.value || null)}
            />
          </InputGroup>
        </FormField>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Address</h2>
        <FormField label="Address line 1" htmlFor="addressLine1" error={fieldErrors.addressLine1}>
          <InputGroup>
            <InputGroupIcon icon={MapPin} />
            <Input
              id="addressLine1"
              inGroup
              autoComplete="address-line1"
              value={values.addressLine1 ?? ''}
              onChange={(e) => handleChange('addressLine1', e.target.value || null)}
            />
          </InputGroup>
        </FormField>
        <FormField label="Address line 2" htmlFor="addressLine2" error={fieldErrors.addressLine2}>
          <InputGroup>
            <InputGroupIcon icon={MapPin} />
            <Input
              id="addressLine2"
              inGroup
              autoComplete="address-line2"
              value={values.addressLine2 ?? ''}
              onChange={(e) => handleChange('addressLine2', e.target.value || null)}
            />
          </InputGroup>
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city" error={fieldErrors.city}>
            <InputGroup>
              <InputGroupIcon icon={MapPin} />
              <Input
                id="city"
                inGroup
                autoComplete="address-level2"
                value={values.city ?? ''}
                onChange={(e) => handleChange('city', e.target.value || null)}
              />
            </InputGroup>
          </FormField>
          <FormField label="State / region" htmlFor="stateRegion" error={fieldErrors.stateRegion}>
            <InputGroup>
              <InputGroupIcon icon={MapPin} />
              <Input
                id="stateRegion"
                inGroup
                autoComplete="address-level1"
                value={values.stateRegion ?? ''}
                onChange={(e) => handleChange('stateRegion', e.target.value || null)}
              />
            </InputGroup>
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Postal code" htmlFor="postalCode" error={fieldErrors.postalCode}>
            <InputGroup>
              <InputGroupIcon icon={MapPin} />
              <Input
                id="postalCode"
                inGroup
                autoComplete="postal-code"
                value={values.postalCode ?? ''}
                onChange={(e) => handleChange('postalCode', e.target.value || null)}
              />
            </InputGroup>
          </FormField>
          <FormField label="Country (2-letter code)" htmlFor="country" error={fieldErrors.country}>
            <InputGroup>
              <InputGroupIcon icon={Globe} />
              <Input
                id="country"
                inGroup
                autoComplete="country"
                placeholder="US"
                maxLength={2}
                value={values.country ?? ''}
                onChange={(e) => handleChange('country', e.target.value.toUpperCase())}
              />
            </InputGroup>
          </FormField>
        </div>
      </section>

      <Button type="submit" disabled={isProfileSaving}>
        {isProfileSaving ? <Spinner size="sm" /> : 'Save profile'}
      </Button>
    </Form>
  )
}
