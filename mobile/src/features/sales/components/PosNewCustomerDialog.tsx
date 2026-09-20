import { useEffect, useState } from 'react'
import { View } from 'react-native'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  PhoneInput,
  TextField,
  formatPhoneE164,
} from '@webonone/mobile-ui'
import { customersApi, type CustomerOption } from '@/features/sales/services/customersApi'
import { posNewCustomerSchema, type PosNewCustomerValues } from '@/features/sales/schemas/salesSchemas'

type PosNewCustomerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (customer: CustomerOption) => void
}

const EMPTY: PosNewCustomerValues = {
  firstName: '',
  lastName: '',
  email: undefined,
  phoneNumber: '+94',
}

export function PosNewCustomerDialog({ open, onOpenChange, onCreated }: PosNewCustomerDialogProps) {
  const [values, setValues] = useState<PosNewCustomerValues>(EMPTY)
  const [phoneCountry, setPhoneCountry] = useState('LK')
  const [phoneNational, setPhoneNational] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PosNewCustomerValues, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY)
    setPhoneCountry('LK')
    setPhoneNational('')
    setFieldErrors({})
    setError(null)
  }, [open])

  async function handleSubmit() {
    const parsed = posNewCustomerSchema.safeParse({
      ...values,
      phoneNumber: formatPhoneE164(phoneCountry, phoneNational),
    })
    if (!parsed.success) {
      const next: Partial<Record<keyof PosNewCustomerValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !next[key as keyof PosNewCustomerValues]) {
          next[key as keyof PosNewCustomerValues] = issue.message
        }
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setBusy(true)
    setError(null)
    try {
      const created = await customersApi.create({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phoneNumber: parsed.data.phoneNumber,
      })
      onCreated(created)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New customer"
      description="Create and assign a customer to this company."
      sizeWidth="large"
      sizeHeight="large"
      footer={
        <View className="flex-row justify-end gap-2">
          <Button variant="outline" onPress={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onPress={() => void handleSubmit()} disabled={busy}>Save</Button>
        </View>
      }
    >
      <View className="gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <TextField
          label="First name"
          required
          value={values.firstName}
          onChangeText={(firstName) => setValues((prev) => ({ ...prev, firstName }))}
          error={fieldErrors.firstName}
        />
        <TextField
          label="Last name"
          required
          value={values.lastName}
          onChangeText={(lastName) => setValues((prev) => ({ ...prev, lastName }))}
          error={fieldErrors.lastName}
        />
        <TextField
          label="Email"
          value={values.email ?? ''}
          onChangeText={(email) => setValues((prev) => ({ ...prev, email }))}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PhoneInput
          label="Phone"
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
          value={phoneNational}
          onChangeText={setPhoneNational}
          error={fieldErrors.phoneNumber}
        />
      </View>
    </CustomDialog>
  )
}
