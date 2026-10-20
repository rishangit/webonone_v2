import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  PLATFORM_EMBED_QUERY,
  getPlatformEmbedParentOrigin,
  sendPlatformPeerDialogBusy,
  sendPlatformPeerDialogComplete,
  usePlatformPeerDialogSubmit,
} from '@webonone/platform-embed'
import { Alert, AlertDescription, Spinner } from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  CREATE_FOLDER_DIALOG,
  CreateFolderFields,
  folderPathForName,
  validateFolderName,
} from '@/features/media/components/CreateFolderDialog'
import { EmbedLayout } from '@/features/media/components/EmbedLayout'
import { useEmbedMode } from '@/features/media/hooks/useEmbedMode'
import { useMediaEmbedAuth } from '@/features/media/hooks/useMediaEmbedAuth'
import { createFolder } from '@/features/media/services/mediaApi'

/** Peer-dialog body for a new media folder. The parent owns the header and footer. */
export function CreateFolderEmbedPage() {
  const [searchParams] = useSearchParams()
  const embed = useEmbedMode()
  const { accessToken } = useMediaEmbedAuth(embed)
  const parentOrigin = getPlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)
  const requestId = searchParams.get(PLATFORM_EMBED_QUERY.DIALOG_REQUEST_ID)?.trim() ?? ''
  const mediaScope = searchParams.get('mediaScope')?.trim() ?? ''
  const folderPath = searchParams.get('folderPath')?.trim() || '/'
  const isValid = Boolean(parentOrigin && requestId && mediaScope)

  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!parentOrigin || !requestId) return
    sendPlatformPeerDialogBusy(
      parentOrigin,
      requestId,
      isSaving,
      isSaving ? CREATE_FOLDER_DIALOG.creatingLabel : CREATE_FOLDER_DIALOG.submitLabel,
    )
  }, [isSaving, parentOrigin, requestId])

  async function handleSubmit() {
    if (!parentOrigin || !requestId || isSaving) return
    const validationError = validateFolderName(name)
    if (validationError) {
      setError(validationError)
      return
    }
    setIsSaving(true)
    setError(undefined)
    try {
      await createFolder(mediaScope, folderPathForName(folderPath, name.trim()), name.trim())
      sendPlatformPeerDialogComplete(parentOrigin, requestId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
      setIsSaving(false)
    }
  }

  usePlatformPeerDialogSubmit({
    parentOrigin: isValid ? parentOrigin : null,
    requestId: isValid ? requestId : null,
    onSubmit: () => void handleSubmit(),
  })

  if (!isValid) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-sm">
          <AlertDescription>This page is available only for platform peer dialog embeds.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <EmbedLayout title="" parentOrigin={parentOrigin} chromeless inset>
        <div className="flex items-center justify-center py-6">
          <Spinner size="lg" />
        </div>
      </EmbedLayout>
    )
  }

  return (
    <EmbedLayout title="" parentOrigin={parentOrigin} chromeless inset>
      <CreateFolderFields
        name={name}
        error={error}
        disabled={isSaving}
        onNameChange={(next) => {
          setName(next)
          if (error) setError(undefined)
        }}
        onSubmit={() => void handleSubmit()}
      />
    </EmbedLayout>
  )
}
