import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import {
  aiSettingsApi,
  type AiSupportedArea,
  type AiToolOperationKind,
} from '@/features/settings/basic/services/aiSettingsApi'

function areaTranslationBase(id: string): string {
  return `ai.supportedAreas.areas.${id}`
}

function OperationChips({
  operations,
  labelFor,
}: {
  operations: AiToolOperationKind[]
  labelFor: (op: AiToolOperationKind) => string
}) {
  if (operations.length === 0) {
    return null
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {operations.map((op) => (
        <span
          key={op}
          className="rounded-md border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {labelFor(op)}
        </span>
      ))}
    </div>
  )
}

function SupportedAreaRow({ area }: { area: AiSupportedArea }) {
  const { t } = useTranslation('settings')
  const base = areaTranslationBase(area.id)
  const title = t(`${base}.title`, { defaultValue: area.id })
  const detail = t(`${base}.detail`, { defaultValue: '' })

  return (
    <div className="space-y-2 border-b border-[hsl(var(--glass-border))] pb-4 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {area.requiresCompany ? (
          <span className="text-xs text-muted-foreground">{t('ai.supportedAreas.requiresCompany')}</span>
        ) : null}
      </div>
      {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
      <OperationChips
        operations={area.operations}
        labelFor={(op) => t(`ai.supportedAreas.operations.${op}`)}
      />
    </div>
  )
}

export function AiSupportedAreasCard() {
  const { t } = useTranslation('settings')
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [areas, setAreas] = useState<AiSupportedArea[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void aiSettingsApi
      .getSupportedAreas(accessToken)
      .then((response) => {
        if (!cancelled) {
          setAreas(response.areas)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('ai.supportedAreas.loadFailed'))
          setAreas([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, t])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('ai.supportedAreas.title')}</CardTitle>
        <CardDescription>{t('ai.supportedAreas.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" aria-hidden />
            {t('ai.supportedAreas.loading')}
          </div>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {!loading && !error && areas && areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('ai.supportedAreas.empty')}</p>
        ) : null}
        {!loading && areas && areas.length > 0 ? (
          <div className="space-y-4">
            {areas.map((area) => (
              <SupportedAreaRow key={area.id} area={area} />
            ))}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{t('ai.supportedAreas.footnote')}</p>
      </CardContent>
    </Card>
  )
}
