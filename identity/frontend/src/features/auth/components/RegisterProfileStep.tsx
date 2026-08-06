import { useState } from 'react'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Form,
  FormField,
  Input,
  InputGroup,
  InputGroupIcon,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { registerProfileSchema, type RegisterProfileFormValues } from '../schemas/authSchemas'

type RegisterProfileStepProps = {
  initialValues: RegisterProfileFormValues
  onSuccess: (values: RegisterProfileFormValues) => void
  onBack: () => void
}

export function RegisterProfileStep({ initialValues, onSuccess, onBack }: RegisterProfileStepProps) {
  const { t } = useTranslation('auth')
  const [values, setValues] = useState<RegisterProfileFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterProfileFormValues, string>>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = registerProfileSchema.safeParse(values)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    onSuccess(parsed.data)
  }

  return (
    <Form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label={t('firstName')}
          htmlFor="register-firstName"
          required
          error={fieldErrors.firstName ? t(fieldErrors.firstName) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="register-firstName"
              inGroup
              autoComplete="given-name"
              value={values.firstName}
              onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
            />
          </InputGroup>
        </FormField>
        <FormField
          label={t('lastName')}
          htmlFor="register-lastName"
          required
          error={fieldErrors.lastName ? t(fieldErrors.lastName) : undefined}
        >
          <InputGroup>
            <InputGroupIcon icon={User} />
            <Input
              id="register-lastName"
              inGroup
              autoComplete="family-name"
              value={values.lastName}
              onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
            />
          </InputGroup>
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="w-full" onClick={onBack}>
          {t('back')}
        </Button>
        <Button type="submit" className="w-full">
          {t('continue')}
        </Button>
      </div>
    </Form>
  )
}
