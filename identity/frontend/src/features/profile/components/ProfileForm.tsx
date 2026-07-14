import { useCallback, useEffect, useState } from 'react'
import { Globe, MapPin, User } from 'lucide-react'
import { useMediaEmbedMessage } from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
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
import type { UserProfile } from '@/shared/types/auth.types'
import { authActions } from '@/features/auth/store'
import {
  profileFormToUpdateInput,
  profileSchema,
  type ProfileFormValues,
  userToProfileFormValues,
} from '../schemas/profileSchemas'
import { getMediaOrigin } from '../utils/mediaConfig'
import { ProfileAvatarEditor } from './ProfileAvatarEditor'
import { ProfileMediaSelectorModal } from './ProfileMediaSelectorModal'
import { ProfileView } from './ProfileView'

interface ProfileFormProps {
  user: UserProfile
}

export function ProfileForm({ user }: ProfileFormProps) {
  const dispatch = useAppDispatch()
  const { isProfileSaving, profileError, profileSaveSuccess, accessToken } = useAppSelector(
    (s) => s.auth,
  )
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [values, setValues] = useState<ProfileFormValues>(() => userToProfileFormValues(user))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>(
    {},
  )
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorOpenKey, setSelectorOpenKey] = useState(0)

  const displayAvatarUrl = pendingAvatarUrl ?? user.avatarUrl

  const handleMediaSelect = useCallback((items: { url: string }[]) => {
    const item = items[0]
    if (item) {
      setPendingAvatarUrl(item.url)
      setSelectorOpen(false)
    }
  }, [])

  useMediaEmbedMessage({
    mediaOrigin: getMediaOrigin(),
    onSelect: (message) => handleMediaSelect(message.items),
  })

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
      setMode('view')
      setPendingAvatarUrl(null)
      const timer = window.setTimeout(() => {
        dispatch(authActions.clearProfileSaveSuccess())
      }, 3000)
      return () => window.clearTimeout(timer)
    }
  }, [profileSaveSuccess, dispatch])

  function resetEditState() {
    setValues(userToProfileFormValues(user))
    const parsed = parsePhoneE164(user.phoneNumber, {
      fallbackIso2: getBrowserDefaultCountryIso2(),
      preferIso2: user.country ?? undefined,
    })
    setPhoneCountry(parsed.iso2)
    setPhoneNational(parsed.nationalNumber)
    setFieldErrors({})
    setPendingAvatarUrl(null)
  }

  function handleChange<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleCancelEdit() {
    resetEditState()
    setMode('view')
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

    const body = {
      ...profileFormToUpdateInput(parsed.data),
      ...(pendingAvatarUrl !== null ? { avatarUrl: pendingAvatarUrl } : {}),
    }

    dispatch(authActions.profileUpdateRequested({ body }))
  }

  if (mode === 'view') {
    return (
      <ProfileView
        user={user}
        avatarUrl={displayAvatarUrl}
        onEdit={() => {
          resetEditState()
          setMode('edit')
        }}
      />
    )
  }

  return (
    <>
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
          <ProfileAvatarEditor
            displayName={user.displayName}
            avatarUrl={displayAvatarUrl}
            onEditImage={() => {
              if (!accessToken) {
                return
              }
              setSelectorOpenKey((key) => key + 1)
              setSelectorOpen(true)
            }}
          />
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
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

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isProfileSaving}>
            {isProfileSaving ? <Spinner size="sm" /> : 'Save profile'}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isProfileSaving}>
            Cancel
          </Button>
        </div>
      </Form>

      <ProfileMediaSelectorModal
        isOpen={selectorOpen}
        accessToken={accessToken}
        userId={user.id}
        openKey={selectorOpenKey}
        onClose={() => setSelectorOpen(false)}
      />
    </>
  )
}
