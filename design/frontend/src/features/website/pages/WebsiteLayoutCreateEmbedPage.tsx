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
import { websiteFootersActions, websiteHeadersActions, websiteLayoutsActions, websiteThemesActions } from '../store'
import { WebsiteLayoutDialog } from '../components/WebsiteLayoutDialog'
import type { LayoutMetaValues } from '../schemas/websiteMeta'

export function WebsiteLayoutCreateEmbedPage() {
  const { t } = useTranslation('website')
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { detail, detailStatus, detailError, items } = useAppSelector((s) => s.websiteLayouts)
  const headers = useAppSelector((s) => s.websiteHeaders.items)
  const footers = useAppSelector((s) => s.websiteFooters.items)
  const themes = useAppSelector((s) => s.websiteThemes.items)
  const [awaiting, setAwaiting] = useState(false)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const isValid = Boolean(parentOrigin && requestId)

  useEffect(() => {
    dispatch(websiteHeadersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteFootersActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    dispatch(websiteThemesActions.loadListRequested({ page: 1, pageSize: 48, force: true }))
    if (id) dispatch(websiteLayoutsActions.fetchDetailRequested({ id, force: true }))
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

  const layout = isEdit ? (detail?.id === id ? detail : items.find((item) => item.id === id)) : null
  const initial: LayoutMetaValues | undefined =
    isEdit && layout
      ? {
          name: layout.name,
          headerId: layout.headerId,
          footerId: layout.footerId,
          themeId: layout.themeId,
          isDefault: layout.isDefault,
          pageIds: layout.pages.map((page) => page.id),
        }
      : undefined

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
    <WebsiteLayoutDialog
      open
      chrome="embed-page"
      entityId={id}
      initial={initial}
      assignedPages={layout?.pages ?? []}
      headers={headers}
      footers={footers}
      themes={themes}
      isSaving={detailStatus === 'saving'}
      error={awaiting ? detailError : null}
      onOpenChange={(next) => {
        if (!next && parentOrigin && requestId) sendPlatformPeerDialogDismiss(parentOrigin, requestId)
      }}
      onSubmit={(values: LayoutMetaValues) => {
        setAwaiting(true)
        dispatch(websiteLayoutsActions.saveDetailRequested(id ? { id, body: values } : { body: values }))
      }}
    />
  )
}
