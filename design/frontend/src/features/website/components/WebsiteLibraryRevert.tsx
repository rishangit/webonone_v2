import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import { Button, StatusTag, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteLibraryCopyActions } from '../store/websiteLibraryCopyStore'
import type { WebsiteLibraryKind } from '../api'

export function WebsiteLibrarySourceTag({ sourceLibraryId }: { sourceLibraryId: string | null | undefined }) {
  const { t } = useTranslation('website')
  if (!sourceLibraryId) return null
  return <StatusTag variant="member">{t('fromLibrary')}</StatusTag>
}

export function WebsiteLibraryDownloadUpdateButton({
  disabled,
  onClick,
  size,
}: {
  disabled?: boolean
  onClick: () => void
  size?: 'sm' | 'default'
}) {
  const { t } = useTranslation('website')
  return (
    <Button type="button" variant="outline" size={size} disabled={disabled} onClick={onClick}>
      {t('downloadUpdatedFromLibrary')}
    </Button>
  )
}

export function useWebsiteLibraryRevert() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const revertStatus = useAppSelector((s) => s.websiteLibraryCopy.revertStatus)
  const revertError = useAppSelector((s) => s.websiteLibraryCopy.revertError)
  const [pending, setPending] = useState<{ kind: WebsiteLibraryKind; id: string; name: string } | null>(null)

  useEffect(() => {
    if (revertStatus === 'succeeded') {
      toast({ title: t('downloadUpdatedFromLibrarySuccess') })
      dispatch(websiteLibraryCopyActions.revertReset())
      setPending(null)
    }
    if (revertStatus === 'error') {
      toast({
        title: t('downloadUpdatedFromLibraryFailed'),
        description: revertError ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteLibraryCopyActions.revertReset())
    }
  }, [dispatch, revertError, revertStatus, t, toast])

  const dialog = (
    <PlatformAlertConfirmDialog
      open={pending !== null}
      title={pending ? t('downloadUpdatedFromLibraryTitle', { name: pending.name }) : t('downloadUpdatedFromLibrary')}
      description={pending?.kind === 'layouts' ? t('revertLayoutDescription') : t('downloadUpdatedFromLibraryDescription')}
      submitLabel={t('downloadUpdatedFromLibrary')}
      cancelLabel={tc('cancel')}
      confirmDisabled={revertStatus === 'saving'}
      isAllowedParentOrigin={isAllowedParentOrigin}
      onOpenChange={(open) => {
        if (!open) setPending(null)
      }}
      onConfirm={() => {
        if (!pending) return
        dispatch(websiteLibraryCopyActions.revertRequested({ kind: pending.kind, id: pending.id }))
      }}
    />
  )

  return {
    ask: setPending,
    dialog,
    reverting: revertStatus === 'saving',
  }
}
