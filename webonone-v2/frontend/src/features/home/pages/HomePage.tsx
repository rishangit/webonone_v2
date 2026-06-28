import { useEffect, useState } from 'react'
import { FeaturePage } from '@webonone/ui-kit'
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
    <FeaturePage
      title={`Welcome, ${user?.displayName ?? 'User'}!`}
      description="You are signed in to WebOnOne."
    >
      <p className="text-sm text-muted-foreground">{apiStatus}</p>
    </FeaturePage>
  )
}
