import { useState } from 'react'
import { View } from 'react-native'
import { Body, FormField, PhoneInput, TextField, formatPhoneE164 } from '@webonone/mobile-ui'
import {
  createCompanyUserSchema,
  mapZodIssuesToFieldErrors,
  type CreateCompanyUserPayload,
} from '@/features/users/schemas/createCompanyUserSchemas'

const DEFAULT_PHONE_COUNTRY = 'LK'

type CreateCompanyUserFormProps = {
  error?: string | null
  disabled?: boolean
  onValidSubmit: (values: CreateCompanyUserPayload) => void
}

export function CreateCompanyUserForm({ error, disabled, onValidSubmit }: CreateCompanyUserFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY)
  const [phoneNational, setPhoneNational] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function submit() {
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
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return false
    }
    setFieldErrors({})
    onValidSubmit(parsed.data)
    return true
  }

  return (
    <View className="gap-4">
      {error ? <Body className="text-destructive">{error}</Body> : null}

      <FormField label="First name" required error={fieldErrors.firstName}>
        <TextField
          value={firstName}
          onChangeText={setFirstName}
          editable={!disabled}
          autoComplete="name-given"
        />
      </FormField>

      <FormField label="Last name" required error={fieldErrors.lastName}>
        <TextField
          value={lastName}
          onChangeText={setLastName}
          editable={!disabled}
          autoComplete="name-family"
        />
      </FormField>

      <FormField label="Email" error={fieldErrors.email}>
        <TextField
          value={email}
          onChangeText={setEmail}
          editable={!disabled}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Email or phone required"
        />
      </FormField>

      <FormField label="Phone number" error={fieldErrors.phoneNumber}>
        <PhoneInput
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
          value={phoneNational}
          onChangeText={setPhoneNational}
          disabled={disabled}
        />
      </FormField>

      <SubmitCapture submit={submit} />
    </View>
  )
}

let latestSubmit: (() => boolean) | null = null

export function submitCreateCompanyUserForm(): boolean {
  return latestSubmit?.() ?? false
}

function SubmitCapture({ submit }: { submit: () => boolean }) {
  latestSubmit = submit
  return null
}
