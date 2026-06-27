import { useEffect, useState } from 'react'
import {
  CountrySelect,
  FormField,
  Input,
  PhoneInput,
  formatPhoneE164,
  getPhoneCountryByIso2,
  parsePhoneE164,
} from '@webonone/ui-kit'
import type { RegisterCompanyFormValues } from '../../schemas/companySchemas'

interface RegisterWizardStepLocationContactProps {
  values: RegisterCompanyFormValues
  fieldErrors: Partial<Record<keyof RegisterCompanyFormValues, string>>
  isSubmitting: boolean
  onChange: (patch: Partial<RegisterCompanyFormValues>) => void
}

export function RegisterWizardStepLocationContact({
  values,
  fieldErrors,
  isSubmitting,
  onChange,
}: RegisterWizardStepLocationContactProps) {
  const parsedPhone = parsePhoneE164(values.contactPhone, {
    fallbackIso2: values.countryIso2 || undefined,
    preferIso2: values.countryIso2 || undefined,
  })
  const [phoneCountryIso2, setPhoneCountryIso2] = useState(parsedPhone.iso2)
  const [phoneNational, setPhoneNational] = useState(parsedPhone.nationalNumber)

  useEffect(() => {
    const next = parsePhoneE164(values.contactPhone, {
      fallbackIso2: values.countryIso2 || undefined,
      preferIso2: values.countryIso2 || undefined,
    })
    setPhoneCountryIso2(next.iso2)
    setPhoneNational(next.nationalNumber)
  }, [values.contactPhone, values.countryIso2])

  function updatePhone(countryIso2: string, national: string) {
    onChange({ contactPhone: formatPhoneE164(countryIso2, national) })
  }

  const countryName = values.countryIso2
    ? (getPhoneCountryByIso2(values.countryIso2)?.name ?? values.countryIso2)
    : ''

  return (
    <div className="min-w-0 space-y-6 pb-1">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Location</h3>
        <FormField label="Address line 1" htmlFor="register-address-line1" required error={fieldErrors.addressLine1}>
          <Input
            id="register-address-line1"
            value={values.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            placeholder="Street address"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <FormField label="Address line 2" htmlFor="register-address-line2" error={fieldErrors.addressLine2}>
          <Input
            id="register-address-line2"
            value={values.addressLine2}
            onChange={(e) => onChange({ addressLine2: e.target.value })}
            placeholder="Suite, unit, etc. (optional)"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="City" htmlFor="register-city" required error={fieldErrors.city}>
            <Input
              id="register-city"
              value={values.city}
              onChange={(e) => onChange({ city: e.target.value })}
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>

          <FormField label="State / region" htmlFor="register-state" error={fieldErrors.stateRegion}>
            <Input
              id="register-state"
              value={values.stateRegion}
              onChange={(e) => onChange({ stateRegion: e.target.value })}
              placeholder="Optional"
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Postal code" htmlFor="register-postal" error={fieldErrors.postalCode}>
            <Input
              id="register-postal"
              value={values.postalCode}
              onChange={(e) => onChange({ postalCode: e.target.value })}
              placeholder="Optional"
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>

          <FormField label="Country" htmlFor="register-country" required error={fieldErrors.countryIso2}>
            <CountrySelect
              id="register-country"
              value={values.countryIso2}
              onValueChange={(country) => onChange({ countryIso2: country.iso2 })}
              disabled={isSubmitting}
              invalid={Boolean(fieldErrors.countryIso2)}
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Contact</h3>
        <FormField label="Contact email" htmlFor="register-contact-email" required error={fieldErrors.contactEmail}>
          <Input
            id="register-contact-email"
            type="email"
            value={values.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="contact@company.com"
            disabled={isSubmitting}
            className="w-full"
          />
        </FormField>

        <FormField label="Contact phone" htmlFor="register-contact-phone" required error={fieldErrors.contactPhone}>
          <PhoneInput
            id="register-contact-phone"
            country={phoneCountryIso2}
            value={phoneNational}
            onCountryChange={(country) => {
              setPhoneCountryIso2(country.iso2)
              updatePhone(country.iso2, phoneNational)
            }}
            onChange={(e) => {
              const national = e.target.value
              setPhoneNational(national)
              updatePhone(phoneCountryIso2, national)
            }}
            disabled={isSubmitting}
            className="w-full"
            aria-invalid={Boolean(fieldErrors.contactPhone)}
          />
        </FormField>
      </div>

      {countryName ? (
        <p className="sr-only" aria-live="polite">
          Selected country: {countryName}
        </p>
      ) : null}
    </div>
  )
}
