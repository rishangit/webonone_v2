import { useState } from 'react'
import { User } from 'lucide-react'
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
        <FormField label="First name" htmlFor="register-firstName" required error={fieldErrors.firstName}>
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
        <FormField label="Last name" htmlFor="register-lastName" required error={fieldErrors.lastName}>
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
          Back
        </Button>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </div>
    </Form>
  )
}
