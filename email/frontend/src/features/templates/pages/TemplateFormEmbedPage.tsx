import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getPlatformEmbedParentOrigin,
  PLATFORM_EMBED_QUERY,
  sendPlatformPeerDialogComplete,
  sendPlatformPeerDialogDismiss,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, Spinner } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { templatesActions } from '@/features/templates/store'
import type { EmailTemplate } from '@/shared/types/email.types'
import type { CreateTemplateBody, UpdateTemplateBody } from '@/shared/services/emailApi'
import { TemplateFormDialog } from '@/features/templates/components/TemplateFormDialog'

export function TemplateFormEmbedPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const {
    createStatus,
    createError,
    createdId,
    detailStatus,
    detailError,
    detail,
  } = useAppSelector((s) => s.templates)

  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const mode = id ? 'edit' : 'create'
  const [awaitingUpdate, setAwaitingUpdate] = useState(false)
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)

  const isValid = Boolean(parentOrigin && requestId)

  useEffect(() => {
    if (mode !== 'edit' || !id || !accessToken) return
    dispatch(templatesActions.fetchDetailRequested({ id }))
  }, [accessToken, dispatch, id, mode])

  useEffect(() => {
    if (mode !== 'edit' || !detail || detail.id !== id) return
    setEditTemplate(detail)
  }, [detail, id, mode])

  useEffect(() => {
    if (mode !== 'create') return
    if (createStatus === 'idle' && createdId && parentOrigin && requestId) {
      sendPlatformPeerDialogComplete(parentOrigin, requestId)
      dispatch(templatesActions.clearCreate())
    }
  }, [createStatus, createdId, dispatch, mode, parentOrigin, requestId])

  useEffect(() => {
    if (!awaitingUpdate || !parentOrigin || !requestId) return
    if (detailStatus === 'idle' && !detailError) {
      setAwaitingUpdate(false)
      sendPlatformPeerDialogComplete(parentOrigin, requestId)
    }
    if (detailStatus === 'error') {
      setAwaitingUpdate(false)
    }
  }, [awaitingUpdate, detailError, detailStatus, parentOrigin, requestId])

  function handleDismiss() {
    if (parentOrigin && requestId) {
      sendPlatformPeerDialogDismiss(parentOrigin, requestId)
    }
  }

  function handleCreate(values: CreateTemplateBody) {
    dispatch(templatesActions.createRequested(values))
  }

  function handleUpdate(values: UpdateTemplateBody) {
    if (!id) return
    setAwaitingUpdate(true)
    dispatch(templatesActions.updateRequested({ id, body: values }))
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

  if (!accessToken || (mode === 'edit' && !editTemplate && detailStatus === 'loading')) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const isSaving =
    mode === 'create' ? createStatus === 'saving' : detailStatus === 'saving'
  const error = mode === 'create' ? createError : awaitingUpdate ? detailError : null

  return (
    <TemplateFormDialog
      chrome="embed-page"
      open
      mode={mode}
      template={editTemplate}
      isSaving={isSaving}
      error={error}
      onOpenChange={(next) => {
        if (!next) handleDismiss()
      }}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    />
  )
}
