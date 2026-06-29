import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, AlertDescription, FeaturePage, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformSessionBootstrap } from '@/features/auth/hooks/usePlatformSessionBootstrap'
import { emailApi } from '@/shared/services/emailApi'
import type { EmailTemplate } from '@/shared/types/email.types'
import { TemplatesList } from '../components/TemplatesList'

export function TemplatesPage() {
  const { accessToken } = useAppSelector((s) => s.auth)
  const { isBootstrapping, bootstrapError, hasCode } = usePlatformSessionBootstrap('/templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadTemplates() {
    setLoading(true)
    setError(null)
    try {
      const data = await emailApi.listTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken || hasCode) {
      return
    }
    void loadTemplates()
  }, [accessToken, hasCode])

  if (isBootstrapping) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{bootstrapError}</AlertDescription>
      </Alert>
    )
  }

  if (!accessToken && !hasCode) {
    return <Navigate to="/login" replace />
  }

  async function handleToggleActive(template: EmailTemplate) {
    setBusyId(template.id)
    setError(null)
    try {
      const updated = await emailApi.setTemplateActive(template.id, !template.isActive)
      setTemplates((current) => current.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <FeaturePage
      title="Templates"
      description="Manage platform and company email templates."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? <p className="text-sm text-muted-foreground">Loading templates…</p> : null}

      {!loading ? (
        <TemplatesList
          templates={templates}
          onToggleActive={handleToggleActive}
          busyId={busyId}
        />
      ) : null}
    </FeaturePage>
  )
}
