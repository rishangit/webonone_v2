import { useState } from 'react'
import { View } from 'react-native'
import { User } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Button, TextField } from '@webonone/mobile-ui'
import {
  mapZodIssuesToFieldErrors,
  registerProfileSchema,
  type RegisterProfileFormValues,
} from '../schemas/authSchemas'

type RegisterProfileStepProps = {
  initialValues: RegisterProfileFormValues
  onSuccess: (values: RegisterProfileFormValues) => void
  onBack: () => void
}

export function RegisterProfileStep({ initialValues, onSuccess, onBack }: RegisterProfileStepProps) {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState<RegisterProfileFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterProfileFormValues, string>>>({})

  function handleSubmit() {
    const parsed = registerProfileSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSuccess(parsed.data)
  }

  return (
    <View className="gap-4">
      <TextField
        label={t('firstName')}
        required
        leadingIcon={User}
        autoComplete="name-given"
        value={values.firstName}
        onChangeText={(firstName) => setValues((prev) => ({ ...prev, firstName }))}
        error={fieldErrors.firstName ? t(fieldErrors.firstName) : undefined}
      />
      <TextField
        label={t('lastName')}
        required
        leadingIcon={User}
        autoComplete="name-family"
        value={values.lastName}
        onChangeText={(lastName) => setValues((prev) => ({ ...prev, lastName }))}
        error={fieldErrors.lastName ? t(fieldErrors.lastName) : undefined}
      />
      <View className="flex-row gap-2">
        <Button variant="outline" className="flex-1" onPress={onBack}>
          {t('back')}
        </Button>
        <Button className="flex-1" onPress={handleSubmit}>
          {t('continue')}
        </Button>
      </View>
    </View>
  )
}
