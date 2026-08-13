import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/shell/utils/platformConfig'
import { AddCompanyUserDialog } from '@/features/users/components/AddCompanyUserDialog'

export function UserSelectionEmbedPage() {
  const { t } = useTranslation('users')
  const [searchParams] = useSearchParams()
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''

  if (!parentOrigin || !requestId) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            {t('errors.peerDialogOnly')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <AddCompanyUserDialog
      chrome="embed-page"
      open
      onOpenChange={() => {
        /* dismiss handled inside dialog body */
      }}
      onSelect={() => {
        /* selection returned via peer-dialog-complete */
      }}
      onCreated={() => {
        /* create returned via peer-dialog-complete */
      }}
    />
  )
}
