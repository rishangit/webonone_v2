import { useCallback, useEffect, useState } from 'react'
import { PageShell, Spinner } from '@webonone/ui-kit'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { EmbedLayout } from '../components/EmbedLayout'
import { MediaPicker } from '../components/MediaPicker'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaParentCommands } from '../hooks/useMediaParentCommands'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'
import type { MediaItemDto } from '@webonone/media-embed'

const DEFAULT_STANDALONE_SCOPE = 'media:library:default'

export function PickerPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postSelect, postSelectionChange } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const [selectedItems, setSelectedItems] = useState<MediaItemDto[]>([])
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const navigate = useNavigate()

  const scope = embed.scope ?? DEFAULT_STANDALONE_SCOPE

  const handleConfirm = useCallback(() => {
    postSelect(selectedItems)
  }, [postSelect, selectedItems])

  useMediaParentCommands(embed.isEmbed, embed.parentOrigin, handleConfirm)

  useEffect(() => {
    if (!embed.isEmbed) {
      return
    }
    postSelectionChange(selectedItems)
  }, [embed.isEmbed, postSelectionChange, selectedItems])

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Media picker" parentOrigin={embed.parentOrigin} chromeless>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Waiting for authentication…</p>
        </div>
      </EmbedLayout>
    )
  }

  const content = (
    <MediaPicker
      scope={scope}
      folderPath={embed.folderPath}
      accept={embed.accept}
      maxFiles={embed.maxFiles}
      mode={embed.mode}
      onSelectionChange={setSelectedItems}
    />
  )

  if (embed.isEmbed) {
    return (
      <EmbedLayout title="Media picker" parentOrigin={embed.parentOrigin} chromeless>
        {content}
      </EmbedLayout>
    )
  }

  return (
    <PageShell
      title="Media"
      user={user ? { email: user.email, displayName: user.displayName } : null}
      onLogout={() => {
        dispatch(authActions.logout())
        navigate('/login')
      }}
    >
      {content}
    </PageShell>
  )
}
