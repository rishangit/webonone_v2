import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/store/hooks'
import { apiClient } from '@/shared/services/apiClient'

export function HomePage() {
  const { user } = useAppSelector((s) => s.auth)
  const [apiStatus, setApiStatus] = useState<string>('checking...')

  useEffect(() => {
    apiClient<{ user: { id: string; email: string } }>('/me')
      .then(() => setApiStatus('API verified with Bearer JWT'))
      .catch(() => setApiStatus('API call failed'))
  }, [])

  return (
  <div>
      <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.displayName ?? 'User'}!</h1>
      <p className="mt-2 text-muted-foreground">You are signed in to WebOnOne.</p>
      <p className="mt-4 text-sm text-muted-foreground">{apiStatus}</p>
      <p className="mt-2">
        <a href="/demo/media" className="text-sm text-primary underline-offset-4 hover:underline">
          Open media picker demo
        </a>
      </p>
    </div>
  )
}
