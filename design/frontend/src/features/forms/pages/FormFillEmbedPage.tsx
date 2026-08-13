import { useSearchParams, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { FormFillDialog, type FormFillMode } from '@/features/forms/components/FormFillDialog'

/** Peer-dialog body for fill/view form (host chrome owned by WebOnOne). */
export function FormFillEmbedPage() {
  const { t } = useTranslation('forms')
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const subjectUserId = searchParams.get('subjectUserId') ?? ''
  const subjectDisplayName = searchParams.get('subjectDisplayName') ?? t('customerFallback')
  const subjectEmail = searchParams.get('subjectEmail')
  const serviceId = searchParams.get('serviceId')
  const serviceName = searchParams.get('serviceName')
  const eventId = searchParams.get('eventId')
  const occurrenceDate = searchParams.get('occurrenceDate')
  const sessionTokenId = searchParams.get('sessionTokenId')
  const submissionId = searchParams.get('submissionId')
  const modeParam = searchParams.get('mode')
  const mode: FormFillMode =
    modeParam === 'view' ? 'view' : modeParam === 'edit' ? 'edit' : 'fill'

  const isValid =
    Boolean(parentOrigin && requestId && id && subjectUserId) &&
    (mode === 'fill' || Boolean(submissionId))

  if (!isValid) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds with a customer subject.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <FormFillDialog
      open
      chrome="embed-page"
      subject={{
        formTemplateId: id!,
        subjectUserId,
        subjectDisplayName,
        subjectEmail,
        serviceId,
        serviceName,
        eventId,
        occurrenceDate,
        sessionTokenId,
        mode,
        submissionId,
      }}
      onOpenChange={(next) => {
        if (!next && parentOrigin && requestId) {
          sendPlatformPeerDialogDismiss(parentOrigin, requestId)
        }
      }}
    />
  )
}
