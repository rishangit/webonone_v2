import { PageShell } from '@webonone/ui-kit'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { authActions } from '@/features/auth/store/authSlice'
import { MediaPicker } from '../components/MediaPicker'

const LIBRARY_SCOPE = 'media:library:default'

export function LibraryPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const navigate = useNavigate()

  return (
    <PageShell
      title="Media Library"
      user={user ? { email: user.email, displayName: user.displayName } : null}
      onLogout={() => {
        dispatch(authActions.logout())
        navigate('/login')
      }}
    >
      <MediaPicker
        scope={LIBRARY_SCOPE}
        folderPath="/"
        accept="*/*"
        maxFiles={10}
        mode="multiple"
      />
    </PageShell>
  )
}
