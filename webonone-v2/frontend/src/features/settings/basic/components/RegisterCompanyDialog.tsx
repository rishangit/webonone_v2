import { useEffect, useState } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import {
  MediaUploadDialogFrame,
  useMediaEmbedMessage,
  type MediaUploadedMessage,
} from '@webonone/media-embed'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import {
  buildCompanyLogoFolderPath,
  buildCompanyLogoScope,
  getMediaOrigin,
  getUploadDialogUrl,
} from '@/features/media/utils/mediaConfig'
import {
  registerCompanyFormSchema,
  registerWizardStep1Schema,
  registerWizardStep2Schema,
  type RegisterCompanyFormValues,
} from '../schemas/companySchemas'
import { RegisterWizardProgress } from './register-wizard/RegisterWizardProgress'
import { RegisterWizardStepBasics } from './register-wizard/RegisterWizardStepBasics'
import { RegisterWizardStepLocationContact } from './register-wizard/RegisterWizardStepLocationContact'
import { RegisterWizardStepSummary } from './register-wizard/RegisterWizardStepSummary'

const EMPTY_VALUES: RegisterCompanyFormValues = {
  name: '',
  description: '',
  companySize: '1-10',
  logoUrl: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: '',
  contactEmail: '',
  contactPhone: '',
}

const STEP_TITLES = ['Company basics', 'Location & contact', 'Summary'] as const
const STEP_DESCRIPTIONS = [
  'Tell us about your company and upload a logo.',
  'Where is your company located and how can we reach you?',
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
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const user = useAppSelector((s) => s.auth.user)
  const [step, setStep] = useState(1)
  const [values, setValues] = useState<RegisterCompanyFormValues>(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterCompanyFormValues, string>>>({})
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const mediaOrigin = getMediaOrigin()

  useMediaEmbedMessage({
    mediaOrigin,
    onUploaded: (message: MediaUploadedMessage) => {
      const item = message.items[0]
      if (item?.url) {
        setValues((prev) => ({ ...prev, logoUrl: item.url }))
        setFieldErrors((prev) => ({ ...prev, logoUrl: undefined }))
      }
      setUploadOpen(false)
    },
  })

  useEffect(() => {
    if (!open) return
    setStep(1)
    setValues(EMPTY_VALUES)
    setFieldErrors({})
    setUploadOpen(false)
  }, [open])

  function patchValues(patch: Partial<RegisterCompanyFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function validateStep(currentStep: number): boolean {
    const schema = currentStep === 1 ? registerWizardStep1Schema : registerWizardStep2Schema
    const result = schema.safeParse(values)
    if (!result.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(result.error.issues))
      return false
    }
    setFieldErrors({})
    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, 3))
  }

  function handlePrevious() {
    setFieldErrors({})
    setStep((s) => Math.max(s - 1, 1))
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

  function openUpload() {
    setUploadKey((k) => k + 1)
    setUploadOpen(true)
  }

  function handleMainOpenChange(next: boolean) {
    if (!next && uploadOpen) {
      setUploadOpen(false)
      return
    }
    onOpenChange(next)
  }

  const stepIndex = step - 1

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={handleMainOpenChange}
        title="Register Company"
        description={STEP_DESCRIPTIONS[stepIndex]}
        sizeWidth="large"
        sizeHeight="xlarge"
        nestedDismissGuard={uploadOpen}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => handleMainOpenChange(false)}
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
            {step < 3 ? (
              <Button type="button" className="h-10" onClick={handleNext} disabled={isSubmitting}>
                Next
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
              Step {step} of 3 — {STEP_TITLES[stepIndex]}
            </p>
            <RegisterWizardProgress currentStep={step} />
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
              hasUser={Boolean(user)}
              onChange={patchValues}
              onOpenUpload={openUpload}
            />
          ) : null}

          {step === 2 ? (
            <RegisterWizardStepLocationContact
              values={values}
              fieldErrors={fieldErrors}
              isSubmitting={isSubmitting}
              onChange={patchValues}
            />
          ) : null}

          {step === 3 ? <RegisterWizardStepSummary values={values} /> : null}
        </div>
      </CustomDialog>

      <CustomDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload company logo"
        description="Crop and upload a square image for your company logo."
        sizeWidth="medium"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
        footer={
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => setUploadOpen(false)}
          >
            Cancel
          </Button>
        }
      >
        {user && accessToken ? (
          <MediaUploadDialogFrame
            key={uploadKey}
            isOpen={uploadOpen}
            accessToken={accessToken}
            mediaOrigin={mediaOrigin}
            baseUrl={getUploadDialogUrl()}
            parentOrigin={window.location.origin}
            scope={buildCompanyLogoScope(user.id)}
            folderPath={buildCompanyLogoFolderPath()}
            mediaType="image"
            crop
            defaultCropAspect="1:1"
            autoClose
            className="h-full min-h-[24rem] w-full border-0 bg-transparent"
          />
        ) : null}
      </CustomDialog>
    </>
  )
}
