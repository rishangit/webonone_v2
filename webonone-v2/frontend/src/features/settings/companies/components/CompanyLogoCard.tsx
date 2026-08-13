import { useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PLATFORM_MESSAGE_TYPES, PlatformAlertConfirmDialog } from '@webonone/platform-embed'
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
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { usePlatformMediaDialog } from '@/features/media/PlatformMediaDialogContext'
import {
  buildCompanyMediaScope,
  buildCompanyProfileFolderPath,
  COMPANY_MEDIA_SCOPED_ROOT,
} from '@/features/media/utils/mediaConfig'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'

type CompanyLogoCardProps = {
  companyId: string
  logoUrl: string | null
  canEdit: boolean
  saving: boolean
}

export function CompanyLogoCard({ companyId, logoUrl, canEdit, saving }: CompanyLogoCardProps) {
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { openMediaDialog } = usePlatformMediaDialog()
  const [confirmRemove, setConfirmRemove] = useState(false)

  function openLogoPicker() {
    openMediaDialog(
      {
        type: PLATFORM_MESSAGE_TYPES.MEDIA_DIALOG_REQUEST,
        requestId: crypto.randomUUID(),
        title: logoUrl ? t('companyCards.logo.pickerReplaceTitle') : t('companyCards.logo.pickerUploadTitle'),
        scope: buildCompanyMediaScope(companyId),
        scopedRoot: COMPANY_MEDIA_SCOPED_ROOT,
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('companyCards.logo.title')}</CardTitle>
          <CardDescription>{t('companyCards.logo.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <ImagePreview
              src={logoUrl}
              alt={t('companyCards.logo.alt')}
              mode={canEdit ? 'edit' : 'view'}
              onEdit={canEdit && !saving ? openLogoPicker : undefined}
            />
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={openLogoPicker} disabled={saving}>
                  <Upload className="h-4 w-4" aria-hidden />
                  {logoUrl ? t('companyCards.logo.replace') : t('companyCards.logo.upload')}
                </Button>
                {logoUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmRemove(true)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    {tc('remove')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          {!logoUrl && canEdit ? (
            <p className="text-sm text-muted-foreground">{t('companyCards.logo.uploadHint')}</p>
          ) : null}
        </CardContent>
      </Card>
      <PlatformAlertConfirmDialog
        open={confirmRemove}
        title={t('companyCards.logo.removeTitle')}
        description={t('companyCards.logo.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
        onOpenChange={setConfirmRemove}
        onConfirm={handleRemove}
      />
    </>
  )
}
