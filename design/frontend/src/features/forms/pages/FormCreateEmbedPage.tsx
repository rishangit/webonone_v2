import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { formsActions } from '@/features/forms/store'
import { FormCreateDialog } from '@/features/forms/components/FormCreateDialog'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import type { FormCreateMetaValues } from '@/features/forms/schemas/formSchemas'

/** Peer-dialog body for create form (host chrome owned by WebOnOne). */
export function FormCreateEmbedPage() {
  const { t } = useTranslation('forms')
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { goToEdit } = useNavigateDesign()
  const { toast } = useToast()
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.forms)
  const [awaitingCreate, setAwaitingCreate] = useState(false)

  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const isValid = Boolean(parentOrigin && requestId)

  useEffect(() => {
    if (!awaitingCreate || !parentOrigin || !requestId) return
    if (detailStatus === 'idle' && detail) {
      setAwaitingCreate(false)
      toast({ title: t('formCreated') })
      sendPlatformPeerDialogComplete(parentOrigin, requestId)
      goToEdit(detail.id)
    }
    if (detailStatus === 'error') {
      setAwaitingCreate(false)
    }
  }, [awaitingCreate, detail, detailStatus, goToEdit, parentOrigin, requestId, t, toast])

  function handleCreate(values: FormCreateMetaValues) {
    setAwaitingCreate(true)
    dispatch(
      formsActions.saveDetailRequested({
        body: {
          name: values.name,
          slug: values.slug,
          definition: { version: 1, fields: [] },
          status: 'draft',
        },
      }),
    )
  }

  if (!isValid) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>
            This page is available only for platform peer dialog embeds.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <FormCreateDialog
      open
      chrome="embed-page"
      isSaving={detailStatus === 'saving'}
      error={awaitingCreate ? detailError : null}
      onOpenChange={(next) => {
        if (!next && parentOrigin && requestId) {
          sendPlatformPeerDialogDismiss(parentOrigin, requestId)
        }
      }}
      onCreate={handleCreate}
    />
  )
}
