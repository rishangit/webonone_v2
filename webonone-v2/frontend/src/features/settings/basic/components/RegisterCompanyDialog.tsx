import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import {
  registerCompanyFormSchema,
  registerWizardStep1Schema,
  type RegisterCompanyFormValues,
} from '../schemas/companySchemas'
import { RegisterWizardProgress } from './register-wizard/RegisterWizardProgress'
import { RegisterWizardStepBasics } from './register-wizard/RegisterWizardStepBasics'
import { RegisterWizardStepSummary } from './register-wizard/RegisterWizardStepSummary'

const EMPTY_VALUES: RegisterCompanyFormValues = {
  name: '',
  description: '',
  companySize: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryIso2: '',
  contactEmail: '',
  contactPhone: '',
}

const STEP_TITLES = ['Company basics', 'Summary'] as const
const STEP_DESCRIPTIONS = [
  'Tell us about your company. You can add contact and location later on the company profile.',
  'Review your details before submitting.',
] as const

interface RegisterCompanyDialogProps {
  open: boolean
  isSubmitting: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RegisterCompanyFormValues) => void
}

export function RegisterCompanyDialog({
  open,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: RegisterCompanyDialogProps) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<RegisterCompanyFormValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegisterCompanyFormValues, string>>
  >({})

  useEffect(() => {
    if (!open) return
    setStep(1)
    setValues(EMPTY_VALUES)
    setFieldErrors({})
  }, [open])

  function patchValues(patch: Partial<RegisterCompanyFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleNext() {
    const result = registerWizardStep1Schema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    setStep(2)
  }

  function handlePrevious() {
    setFieldErrors({})
    setStep(1)
  }

  function handleSubmit() {
    const result = registerCompanyFormSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return
    }
    setFieldErrors({})
    onSubmit(result.data)
  }

  const stepIndex = step - 1

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register Company"
      description={STEP_DESCRIPTIONS[stepIndex]}
      sizeWidth="large"
      sizeHeight="large"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          ) : null}
          {step < 2 ? (
            <Button type="button" className="h-10 px-4" onClick={handleNext} disabled={isSubmitting}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" className="h-10" onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Submitting…' : 'Submit registration'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step} of 2 — {STEP_TITLES[stepIndex]}
          </p>
          <RegisterWizardProgress currentStep={step} totalSteps={2} />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === 1 ? (
          <RegisterWizardStepBasics
            values={values}
            fieldErrors={fieldErrors}
            isSubmitting={isSubmitting}
            onChange={patchValues}
          />
        ) : null}

        {step === 2 ? <RegisterWizardStepSummary values={values} /> : null}
      </div>
    </CustomDialog>
  )
}
