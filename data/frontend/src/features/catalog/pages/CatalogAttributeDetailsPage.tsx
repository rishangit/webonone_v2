import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { CatalogAttributeValueDialog } from '@/features/catalog/components/CatalogAttributeValueDialog'
import { CatalogAttributeValuesPanel } from '@/features/catalog/components/CatalogAttributeValuesPanel'
import {
  getCatalogEntity,
  type CatalogEntityKind,
} from '@/features/catalog/utils/catalogAttributeApi'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import type { CatalogAttributeValue, CatalogAttributeValueEntry, CatalogItem } from '@/shared/types/data.types'

type CatalogAttributeDetailsPageProps = {
  kind: CatalogEntityKind
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function resolveEntityId(kind: CatalogEntityKind, params: Record<string, string | undefined>) {
  if (kind === 'products') return params.productId
  if (kind === 'services') return params.serviceId
  return params.spaceId
}

function resolveListPath(kind: CatalogEntityKind) {
  return `/${kind}`
}

export function CatalogAttributeDetailsPage({ kind }: CatalogAttributeDetailsPageProps) {
  const { t } = useTranslation(kind)
  const params = useParams<{
    productId?: string
    serviceId?: string
    spaceId?: string
    attributeId?: string
  }>()
  const entityId = resolveEntityId(kind, params)
  const attributeId = params.attributeId
  const { goToDetail } = useNavigateDataEntity()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canEdit =
    user?.role === 'super_admin' || user?.role === 'company_admin'
  const [entity, setEntity] = useState<CatalogItem | null>(null)
  const [attribute, setAttribute] = useState<CatalogAttributeValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [valueDialogOpen, setValueDialogOpen] = useState(false)
  const [dialogValue, setDialogValue] = useState<CatalogAttributeValueEntry | null>(null)

  function openValueDialog(value: CatalogAttributeValueEntry | null = null) {
    setDialogValue(value)
    setValueDialogOpen(true)
  }

  function closeValueDialog() {
    setValueDialogOpen(false)
    setDialogValue(null)
  }

  const load = useCallback(async () => {
    if (!entityId || !attributeId) return
    setLoading(true)
    setError(null)
    try {
      const result = await getCatalogEntity(kind, entityId)
      const found = result.attributes.find((entry) => entry.attributeId === attributeId) ?? null
      setEntity(result)
      setAttribute(found)
      if (!found) {
        setError(t('catalog.attributeNotFound'))
      }
    } catch (err) {
      setEntity(null)
      setAttribute(null)
      setError(err instanceof Error ? err.message : t('catalog.loadAttributeFailed'))
    } finally {
      setLoading(false)
    }
  }, [attributeId, entityId, kind, t])

  useEffect(() => {
    void load()
  }, [load])

  usePlatformLoading(loading && !attribute ? t('catalog.loadingAttribute') : null)

  if (!accessToken) return <Navigate to="/login" replace />
  if (!entityId || !attributeId) return <Navigate to={resolveListPath(kind)} replace />

  const unitLabel = attribute?.unit
    ? `${attribute.unit.name}${attribute.unit.symbol ? ` (${attribute.unit.symbol})` : ''}`
    : t('catalog.noUnit')

  return (
    <FeaturePage
      title={attribute?.name ?? t('catalog.attributeFallback')}
      description={t('catalog.attributeDetails')}
      onBack={() => goToDetail(kind, entityId, { tab: 'attributes' })}
      backLabel={t('common:back')}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {attribute && entity ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title={t('catalog.attributeValues')}
              description={t('catalog.attributeValuesDescription')}
              variant="list"
            >
              {canEdit ? (
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={() => openValueDialog()}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {t('catalog.addValue')}
                  </Button>
                </div>
              ) : null}
              <CatalogAttributeValuesPanel
                kind={kind}
                entityId={entityId}
                attribute={attribute}
                canEdit={canEdit}
                showAddForm={false}
                onRequestEdit={(entry) => openValueDialog(entry)}
                onChanged={() => {
                  void load()
                }}
              />
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('catalog.attributeDefinition')}</CardTitle>
                <CardDescription>{t('catalog.attributeDefinitionDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('catalog.definitionName')} value={attribute.name} />
                <ReadOnlyField
                  label={t('catalog.definitionValueType')}
                  value={attribute.valueType}
                />
                <ReadOnlyField label={t('catalog.definitionUnit')} value={unitLabel} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => goToDetail('attributes', attribute.attributeId)}
                >
                  {t('catalog.viewGlobalDefinition')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {attribute && entity ? (
        <CatalogAttributeValueDialog
          open={valueDialogOpen}
          kind={kind}
          entityId={entityId}
          attribute={attribute}
          value={dialogValue}
          onOpenChange={(open) => {
            if (!open) closeValueDialog()
            else setValueDialogOpen(true)
          }}
          onSaved={() => {
            void load()
          }}
        />
      ) : null}
    </FeaturePage>
  )
}

export function ProductAttributeDetailsPage() {
  return <CatalogAttributeDetailsPage kind="products" />
}

export function ServiceAttributeDetailsPage() {
  return <CatalogAttributeDetailsPage kind="services" />
}

export function SpaceAttributeDetailsPage() {
  return <CatalogAttributeDetailsPage kind="spaces" />
}
