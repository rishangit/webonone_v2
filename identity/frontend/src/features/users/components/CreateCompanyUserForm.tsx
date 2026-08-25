import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  AlertDescription,
  FormField,
  Input,
  PhoneInput,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import {
  createCompanyUserSchema,
  type CreateCompanyUserPayload,
} from '@/features/users/schemas/createCompanyUserSchemas'

export const CREATE_COMPANY_USER_FORM_ID = 'create-company-user-form'

export type CreateCompanyUserFormProps = {
  formId?: string
  error?: string | null
  disabled?: boolean
  onSubmit: (values: CreateCompanyUserPayload) => void
}

export function CreateCompanyUserForm({
  formId = CREATE_COMPANY_USER_FORM_ID,
  error,
  disabled,
  onSubmit,
}: CreateCompanyUserFormProps) {
  const { t } = useTranslation('users')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const phoneNumber = phoneNational.trim()
      ? formatPhoneE164(phoneCountry, phoneNational)
      : ''
    const parsed = createCompanyUserSchema.safeParse({
      firstName,
      lastName,
      email,
      phoneNumber,
    })
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues) as Record<string, string>)
      return
    }
    setFieldErrors({})
    onSubmit(parsed.data)
  }

  return (
    <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        label={t('form.firstName')}
        htmlFor="create-user-first-name"
        required
        error={fieldErrors.firstName ? t(fieldErrors.firstName) : undefined}
      >
        <Input
          id="create-user-first-name"
          value={firstName}
          disabled={disabled}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
        />
      </FormField>

      <FormField
        label={t('form.lastName')}
        htmlFor="create-user-last-name"
        required
        error={fieldErrors.lastName ? t(fieldErrors.lastName) : undefined}
      >
        <Input
          id="create-user-last-name"
          value={lastName}
          disabled={disabled}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
        />
      </FormField>

      <FormField label={t('form.email')} htmlFor="create-user-email" error={fieldErrors.email ? t(fieldErrors.email) : undefined}>
        <Input
          id="create-user-email"
          type="email"
          value={email}
          disabled={disabled}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={t('form.emailPlaceholder')}
        />
      </FormField>

      <FormField
        label={t('form.phoneNumber')}
        htmlFor="create-user-phone"
        error={fieldErrors.phoneNumber ? t(fieldErrors.phoneNumber) : undefined}
      >
        <PhoneInput
          id="create-user-phone"
          withIcon
          country={phoneCountry}
          onCountryChange={(country) => setPhoneCountry(country.iso2)}
          value={phoneNational}
          disabled={disabled}
          onChange={(e) => setPhoneNational(e.target.value)}
          aria-invalid={Boolean(fieldErrors.phoneNumber)}
        />
      </FormField>
    </form>
  )
}

export function submitCreateCompanyUserForm(formId = CREATE_COMPANY_USER_FORM_ID) {
  const form = document.getElementById(formId)
  if (form instanceof HTMLFormElement) {
    form.requestSubmit()
  }
}
