import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FeaturePage,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { useCompanyCatalogAttributeValueDialog } from '@/features/company-catalog/hooks/useCompanyCatalogAttributeValueDialog'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { companyCatalogApi } from '../services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryAttributeValueEntry,
  type LibraryCatalogAttribute,
} from '../services/dataLibraryApi'
import {
  CATALOG_ENTITY_KINDS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '../types/companyCatalog.types'

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

export function CompanyCatalogAttributeDetailsPage() {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { kind: kindParam = '', entityId = '', attributeId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canEdit = activeRole === 'company_admin'
  const [attribute, setAttribute] = useState<LibraryCatalogAttribute | null>(null)
  const [libraryEntityId, setLibraryEntityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingDeleteValue, setPendingDeleteValue] = useState<LibraryAttributeValueEntry | null>(
    null,
  )

  const galleryKind = isCatalogGalleryKind(kindParam as CatalogEntityKind)
    ? (kindParam as 'products' | 'services' | 'spaces')
    : null

  const load = useCallback(async () => {
    if (!isCatalogEntityKind(kindParam) || !entityId || !attributeId) return
    setLoading(true)
    setError(null)
    try {
      const companyEntity = await companyCatalogApi.get(kindParam, entityId)
      if (!companyEntity.libraryEntityId) {
        setAttribute(null)
        setLibraryEntityId(null)
        setError(t('attributeDetail.notLinked'))
        return
      }
      setLibraryEntityId(companyEntity.libraryEntityId)
      const libraryItem = await dataLibraryApi.get(kindParam, companyEntity.libraryEntityId)
      const found =
        parseLibraryAttributes(libraryItem.attributes).find(
          (entry) => entry.attributeId === attributeId,
        ) ?? null
      setAttribute(found)
      if (!found) {
        setError(t('attributeDetail.notFound'))
      }
    } catch (err) {
      setAttribute(null)
      setLibraryEntityId(null)
      setError(err instanceof Error ? err.message : t('attributeDetail.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [attributeId, entityId, kindParam, t])

  useEffect(() => {
    void load()
  }, [load])

  const { openAdd, openEdit } = useCompanyCatalogAttributeValueDialog({
    kind: galleryKind ?? 'products',
    libraryEntityId,
    attributeId,
    attributeName: attribute?.name ?? '',
    onClosed: () => {
      void load()
    },
  })

  usePlatformLoading(loading && !attribute ? t('attributeDetail.loading') : null)

  async function handleSetDefault(entry: LibraryAttributeValueEntry) {
    if (!galleryKind || !libraryEntityId || entry.isDefault || busy) return
    setBusy(true)
    setError(null)
    try {
      await dataLibraryApi.setCatalogAttributeValueDefault(galleryKind, libraryEntityId, entry.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributeDetail.setDefaultFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteValue(entry: LibraryAttributeValueEntry) {
    if (!galleryKind || !libraryEntityId || busy) return
    setBusy(true)
    setError(null)
    try {
      await dataLibraryApi.deleteCatalogAttributeValue(galleryKind, libraryEntityId, entry.id)
      setPendingDeleteValue(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributeDetail.deleteValueFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (!isCatalogEntityKind(kindParam) || !entityId || !attributeId) {
    return <Navigate to="/data/products" replace />
  }

  const unitLabel = attribute?.unit
    ? `${attribute.unit.name}${attribute.unit.symbol ? ` (${attribute.unit.symbol})` : ''}`
    : t('attributeDetail.noUnit')

  return (
    <FeaturePage
      title={attribute?.name ?? t('attributeDetail.titleFallback')}
      description={t('attributeDetail.description')}
      onBack={() => navigate(`/data/${kindParam}/${entityId}?tab=attributes`)}
      backLabel={tc('back')}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {attribute ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title={t('attributeDetail.values.title')}
              description={t('attributeDetail.values.description')}
              variant="list"
            >
              {canEdit && galleryKind && libraryEntityId ? (
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={() => openAdd()} disabled={busy}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {t('attributeDetail.addValue')}
                  </Button>
                </div>
              ) : null}
              {attribute.values.length === 0 ? (
                <ItemListEmpty>{t('attributeDetail.values.empty')}</ItemListEmpty>
              ) : (
                <ItemList className="py-0">
                  {attribute.values.map((value) => {
                    const label = formatLibraryAttributeValueLabel(value, attribute.unit?.symbol)
                    return (
                      <ItemListItem key={value.id}>
                        <ItemListContent>
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate font-medium">{label}</p>
                            {value.isDefault ? (
                              <StatusTag variant="verified" className="shrink-0">
                                {t('attributeDetail.values.default')}
                              </StatusTag>
                            ) : null}
                          </div>
                        </ItemListContent>
                        {canEdit && galleryKind && libraryEntityId ? (
                          <ItemListMenu
                            ariaLabel={t('attributeDetail.actionsForValue', { label })}
                          >
                            {!value.isDefault ? (
                              <DropdownMenuItem
                                disabled={busy}
                                onClick={() => void handleSetDefault(value)}
                              >
                                {t('attributeDetail.setAsDefault')}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              disabled={busy}
                              onClick={() => openEdit(value.id)}
                            >
                              {tc('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={busy}
                              onClick={() => setPendingDeleteValue(value)}
                            >
                              {tc('delete')}
                            </DropdownMenuItem>
                          </ItemListMenu>
                        ) : null}
                      </ItemListItem>
                    )
                  })}
                </ItemList>
              )}
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('attributeDetail.definition.title')}</CardTitle>
                <CardDescription>{t('attributeDetail.definition.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('attributeDetail.definition.name')} value={attribute.name} />
                <ReadOnlyField
                  label={t('attributeDetail.definition.valueType')}
                  value={attribute.valueType}
                />
                <ReadOnlyField label={t('attributeDetail.definition.unit')} value={unitLabel} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <PlatformAlertConfirmDialog
        open={pendingDeleteValue !== null}
        title={
          pendingDeleteValue
            ? t('attributeDetail.deleteValueConfirm', {
                value: formatLibraryAttributeValueLabel(
                  pendingDeleteValue,
                  attribute?.unit?.symbol,
                ),
              })
            : t('attributeDetail.deleteValueFallback')
        }
        description={t('attributeDetail.deleteValueDescription', {
          name: attribute?.name ?? '',
        })}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('delete')}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteValue(null)
        }}
        onConfirm={() => {
          if (pendingDeleteValue) {
            void handleDeleteValue(pendingDeleteValue)
          }
        }}
      />
    </FeaturePage>
  )
}
