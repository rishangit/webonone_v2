import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
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
import { websiteDatasetsActions } from '../store'
import { WebsiteDatasetDialog } from '../components/WebsiteDatasetDialog'
import type { CreateWebsiteDatasetValues } from '../schemas/websiteDatasetSchemas'

export function WebsiteDatasetCreateEmbedPage() {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteDatasets)
  const [awaiting, setAwaiting] = useState(false)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const isValid = Boolean(parentOrigin && requestId)

  useEffect(() => {
    if (id) dispatch(websiteDatasetsActions.fetchDetailRequested({ id, force: true }))
  }, [dispatch, id])

  useEffect(() => {
    if (!awaiting || !parentOrigin || !requestId) return
    if (detailStatus === 'idle' && detail && (!id || detail.id === id)) {
      setAwaiting(false)
      toast({ title: isEdit ? t('saved') : t('created') })
      sendPlatformPeerDialogComplete(parentOrigin, requestId)
    }
    if (detailStatus === 'error') setAwaiting(false)
  }, [awaiting, detail, detailStatus, id, isEdit, parentOrigin, requestId, t, toast])

  if (!isValid) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const initial = isEdit && detail && detail.id === id ? detail : null

  if (isEdit && !initial) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        {detailError ? (
          <Alert variant="destructive" className="max-w-sm">
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <WebsiteDatasetDialog
      open
      chrome="embed-page"
      entityId={id}
      initial={initial}
      isSaving={detailStatus === 'saving'}
      error={awaiting ? detailError : null}
      onOpenChange={(next) => {
        if (!next && parentOrigin && requestId) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(values: CreateWebsiteDatasetValues) => {
        setAwaiting(true)
        dispatch(
          websiteDatasetsActions.saveDetailRequested(
            id ? { id, body: values } : { body: values },
          ),
        )
      }}
    />
  )
}
