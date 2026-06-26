import { useEffect, useState } from 'react'
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
  FormField,
  Input,
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
  type RegisterCompanyFormValues,
} from '../schemas/companySchemas'

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
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterCompanyFormValues, string>>>({})
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const mediaOrigin = getMediaOrigin()

  useMediaEmbedMessage({
    mediaOrigin,
    onUploaded: (message: MediaUploadedMessage) => {
      const item = message.items[0]
      if (item?.url) {
        setLogoUrl(item.url)
      }
      setUploadOpen(false)
    },
  })

  useEffect(() => {
    if (!open) return
    setName('')
    setLogoUrl(null)
    setFieldErrors({})
    setUploadOpen(false)
  }, [open])

  function handleSubmit() {
    const result = registerCompanyFormSchema.safeParse({
      name,
      logoUrl: logoUrl ?? '',
    })
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

  return (
    <>
      <CustomDialog open={open} onOpenChange={onOpenChange} title="Register Company" sizeWidth="medium">
        <div className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Company name" htmlFor="register-company-name" required error={fieldErrors.name}>
            <Input
              id="register-company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your company name"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Company logo" htmlFor="register-company-logo" required error={fieldErrors.logoUrl}>
            <div className="flex flex-col gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo preview" className="h-20 w-20 rounded-md object-cover" />
              ) : (
                <p className="text-sm text-muted-foreground">Upload a square logo image.</p>
              )}
              <Button type="button" variant="secondary" onClick={openUpload} disabled={isSubmitting || !user}>
                {logoUrl ? 'Change logo' : 'Upload logo'}
              </Button>
            </div>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit registration'}
            </Button>
          </div>
        </div>
      </CustomDialog>

      <CustomDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload company logo"
        sizeWidth="medium"
        sizeHeight="large"
        noContentPadding
        disableContentScroll
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
