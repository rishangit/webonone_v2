import { Callout, CalloutDescription, PageShell, Spinner } from '@webonone/ui-kit'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { EmbedLayout } from '../components/EmbedLayout'
import { MediaPicker } from '../components/MediaPicker'
import { useEmbedMode } from '../hooks/useEmbedMode'
import { useMediaAuth } from '../hooks/useMediaAuth'
import { useMediaPostMessage } from '../hooks/useMediaPostMessage'

const DEFAULT_STANDALONE_SCOPE = 'media:library:default'

export function UploadPage() {
  const embed = useEmbedMode()
  const { accessToken } = useMediaAuth(embed.isEmbed)
  const { postUploaded } = useMediaPostMessage(embed.parentOrigin, embed.scope)
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const navigate = useNavigate()

  const scope = embed.scope ?? DEFAULT_STANDALONE_SCOPE

  if (embed.isEmbed && !accessToken) {
    return (
      <EmbedLayout title="Upload" parentOrigin={embed.parentOrigin}>
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner size="lg" />
          <Callout variant="muted" className="max-w-sm text-center">
            <CalloutDescription>Waiting for authentication…</CalloutDescription>
          </Callout>
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
      onUploaded={embed.isEmbed ? postUploaded : undefined}
    />
  )

  if (embed.isEmbed) {
    return <EmbedLayout title="Upload" parentOrigin={embed.parentOrigin}>{content}</EmbedLayout>
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
