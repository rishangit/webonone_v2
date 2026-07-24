import { Trash2, Upload } from 'lucide-react'
import { PLATFORM_MESSAGE_TYPES } from '@webonone/platform-embed'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ImagePreview,
} from '@webonone/ui-kit'
import { useAppDispatch } from '@/app/store/hooks'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import {
  buildCompanyMediaScope,
  buildCompanyProfileFolderPath,
} from '@/features/media/utils/mediaConfig'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'

type CompanyLogoCardProps = {
  companyId: string
  logoUrl: string | null
  canEdit: boolean
  saving: boolean
}

export function CompanyLogoCard({ companyId, logoUrl, canEdit, saving }: CompanyLogoCardProps) {
  const dispatch = useAppDispatch()
  const { openMediaDialog } = usePlatformMediaDialog()

  function openLogoPicker() {
    openMediaDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST,
        requestId: crypto.randomUUID(),
        title: logoUrl ? 'Replace company logo' : 'Upload company logo',
        scope: buildCompanyMediaScope(companyId),
        folderPath: buildCompanyProfileFolderPath(companyId),
        mode: 'single',
        accept: 'image/*',
        selectorUpload: true,
        cropAspectPresets: ['1:1'],
      },
      {
        resolve: (items) => {
          const item = items[0]
          if (!item?.url) return
          dispatch(
            companiesActions.updateCompanyDetailRequested({
              id: companyId,
              body: { logoUrl: item.url },
            }),
          )
        },
        cancel: () => {},
      },
    )
  }

  function handleRemove() {
    dispatch(
      companiesActions.updateCompanyDetailRequested({
        id: companyId,
        body: { logoUrl: null },
      }),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company logo</CardTitle>
        <CardDescription>Shown on company lists and profile identity surfaces</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <ImagePreview
            src={logoUrl}
            alt="Company logo"
            mode={canEdit ? 'edit' : 'view'}
            onEdit={canEdit && !saving ? openLogoPicker : undefined}
          />
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={openLogoPicker} disabled={saving}>
                <Upload className="h-4 w-4" aria-hidden />
                {logoUrl ? 'Replace' : 'Upload'}
              </Button>
              {logoUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {!logoUrl && canEdit ? (
          <p className="text-sm text-muted-foreground">Upload a company logo</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
