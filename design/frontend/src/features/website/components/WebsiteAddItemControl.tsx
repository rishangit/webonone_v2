import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListAddButton, useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import type { WebsiteLibraryKind } from '../api'
import { websiteLibraryCopyActions } from '../store/websiteLibraryCopyStore'
import { WebsiteAddSourceDialog, type WebsiteAddSource } from './WebsiteAddSourceDialog'
import { WebsiteLibraryPickerDialog } from './WebsiteLibraryPickerDialog'

export function WebsiteAddItemControl({
  kind,
  addLabel,
  compactAddLabel,
  onCreate,
}: {
  kind: WebsiteLibraryKind
  addLabel: string
  compactAddLabel: string
  onCreate: () => void
}) {
  const { t } = useTranslation('website')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const [sourceOpen, setSourceOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const copy = useAppSelector((state) => state.websiteLibraryCopy)

  useEffect(() => {
    if (copy.status === 'idle' || copy.kind !== kind) return
    if (copy.status === 'succeeded') {
      toast({ title: t('addedFromLibrary') })
      dispatch(websiteLibraryCopyActions.copyReset())
    } else if (copy.status === 'error') {
      toast({
        title: t('addFromLibraryFailed'),
        description: copy.error ?? undefined,
        variant: 'destructive',
      })
      dispatch(websiteLibraryCopyActions.copyReset())
    }
  }, [copy.error, copy.kind, copy.status, dispatch, kind, t, toast])

  function handleChoose(source: WebsiteAddSource) {
    if (source === 'library') {
      setLibraryOpen(true)
      return
    }
    onCreate()
  }

  return (
    <>
      <ListAddButton compactLabel={compactAddLabel} onClick={() => setSourceOpen(true)}>
        {addLabel}
      </ListAddButton>
      <WebsiteAddSourceDialog
        kind={kind}
        title={addLabel}
        open={sourceOpen}
        onOpenChange={setSourceOpen}
        onChoose={handleChoose}
      />
      <WebsiteLibraryPickerDialog
        kind={kind}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(libraryId) => {
          dispatch(websiteLibraryCopyActions.copyRequested({ kind, libraryId }))
        }}
      />
    </>
  )
}
