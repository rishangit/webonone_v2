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
  EditableSectionCard,
  ReadOnlyField,
  StatusTag,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { CompanyCatalogAttributeValueEditDialog } from '../components/CompanyCatalogAttributeValueEditDialog'
import { CompanyCatalogAttributeValuePickerDialog } from '../components/CompanyCatalogAttributeValuePickerDialog'
import { useCompanyCatalogAttributeValueDialog } from '@/features/company-catalog/hooks/useCompanyCatalogAttributeValueDialog'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { companyCatalogApi, type CompanyCatalogAttribute } from '../services/companyCatalogApi'
import {
  dataLibraryApi,
  formatLibraryAttributeValueLabel,
  parseLibraryAttributes,
  type LibraryAttributeValueEntry,
} from '../services/dataLibraryApi'
import {
  CATALOG_ENTITY_KINDS,
  isCatalogGalleryKind,
  type CatalogEntityKind,
} from '../types/companyCatalog.types'

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

function isAttributeValueDeleteBlocked(value: CompanyCatalogAttribute['values'][number]): boolean {
  return (value.usedByVariants?.length ?? 0) > 0
}

export function CompanyCatalogAttributeDetailsPage() {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { kind: kindParam = '', entityId = '', attributeId = '' } = useParams()
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const canEdit = activeRole === 'company_admin'
  const [attribute, setAttribute] = useState<CompanyCatalogAttribute | null>(null)
  const [libraryValues, setLibraryValues] = useState<LibraryAttributeValueEntry[]>([])
  const [libraryEntityId, setLibraryEntityId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<CompanyCatalogAttribute['values'][number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingDeleteValue, setPendingDeleteValue] = useState<
    CompanyCatalogAttribute['values'][number] | null
  >(null)

  const galleryKind = isCatalogGalleryKind(kindParam as CatalogEntityKind)
    ? (kindParam as 'products' | 'services' | 'spaces')
    : null

  const load = useCallback(async () => {
    if (!isCatalogEntityKind(kindParam) || !entityId || !attributeId) return
    setLoading(true)
    setError(null)
    try {
      const result = await companyCatalogApi.listCopiedAttributes(kindParam, entityId)
      setLibraryEntityId(result.libraryEntityId)
      const found = result.attributes.find((entry) => entry.attributeId === attributeId) ?? null
      setAttribute(found)
      if (!found) {
        setLibraryValues([])
        setError(t('attributeDetail.notFound'))
        return
      }
      if (result.libraryEntityId && galleryKind) {
        const libraryItem = await dataLibraryApi.get(galleryKind, result.libraryEntityId)
        const libraryAttribute = parseLibraryAttributes(libraryItem.attributes).find(
          (entry) => entry.attributeId === attributeId,
        )
        const copied = new Set(found.values.map((value) => value.libraryValueId).filter(Boolean))
        setLibraryValues(
          (libraryAttribute?.values ?? []).filter((value) => !copied.has(value.id)),
        )
      } else {
        setLibraryValues([])
      }
    } catch (err) {
      setAttribute(null)
      setLibraryEntityId(null)
      setError(err instanceof Error ? err.message : t('attributeDetail.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [attributeId, entityId, galleryKind, kindParam, t])

  useEffect(() => {
    void load()
  }, [load])

  const { openAdd } = useCompanyCatalogAttributeValueDialog({
    kind: galleryKind ?? 'products',
    libraryEntityId,
    attributeId,
    attributeName: attribute?.name ?? '',
    onClosed: () => {
      void (async () => {
        if (!galleryKind || !libraryEntityId || !isCatalogEntityKind(kindParam)) {
          await load()
          return
        }
        const kind = kindParam
        try {
          const libraryItem = await dataLibraryApi.get(galleryKind, libraryEntityId)
          const libraryAttribute = parseLibraryAttributes(libraryItem.attributes).find(
            (entry) => entry.attributeId === attributeId,
          )
          const current = await companyCatalogApi.listCopiedAttributes(kind, entityId)
          const copied = new Set(
            (current.attributes.find((entry) => entry.attributeId === attributeId)?.values ?? [])
              .map((value) => value.libraryValueId)
              .filter(Boolean),
          )
          const missing = (libraryAttribute?.values ?? [])
            .map((value) => value.id)
            .filter((id) => !copied.has(id))
          if (missing.length > 0) {
            await companyCatalogApi.copyAttributeValuesFromLibrary(kind, entityId, missing)
          }
        } catch {
          // The detail reload surfaces the error.
        }
        await load()
      })()
    },
  })

  usePlatformLoading(loading && !attribute ? t('attributeDetail.loading') : null)

  async function handleSetDefault(entry: { id: string; isDefault: boolean }) {
    if (!isCatalogEntityKind(kindParam) || entry.isDefault || busy) return
    setBusy(true)
    setError(null)
    try {
      await companyCatalogApi.setCopiedAttributeValueDefault(kindParam, entityId, entry.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('attributeDetail.setDefaultFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteValue(entry: { id: string }) {
    if (!isCatalogEntityKind(kindParam) || busy) return
    setBusy(true)
    setError(null)
    try {
      await companyCatalogApi.deleteCopiedAttributeValue(kindParam, entityId, entry.id)
      setPendingDeleteValue(null)
      await load()
    } catch (err) {
      setPendingDeleteValue(null)
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
            <EditableSectionCard title={t('attributeDetail.values.title')} variant="list">
              {canEdit ? (
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={() => setPickerOpen(true)} disabled={busy}>
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
                    const deleteBlocked = isAttributeValueDeleteBlocked(value)
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
                        {canEdit ? (
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
                            <DropdownMenuItem disabled={busy} onClick={() => setEditingValue(value)}>
                              {tc('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={busy || deleteBlocked}
                              onClick={() => {
                                if (deleteBlocked) return
                                setPendingDeleteValue(value)
                              }}
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

      <CompanyCatalogAttributeValuePickerDialog
        open={pickerOpen}
        kind={galleryKind ?? 'products'}
        entityId={entityId}
        attributeName={attribute?.name ?? ''}
        unitSymbol={attribute?.unit?.symbol}
        values={libraryValues}
        onOpenChange={setPickerOpen}
        onCopied={() => {
          void load()
        }}
        onCreateNew={() => {
          setPickerOpen(false)
          openAdd()
        }}
      />
      {galleryKind && editingValue ? (
        <CompanyCatalogAttributeValueEditDialog
          open={editingValue !== null}
          kind={galleryKind}
          entityId={entityId}
          valueId={editingValue.id}
          valueType={attribute?.valueType ?? 'text'}
          initialText={editingValue.valueText}
          initialNumber={editingValue.valueNumber}
          onOpenChange={(next) => {
            if (!next) setEditingValue(null)
          }}
          onSaved={() => {
            void load()
          }}
        />
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
        description={t('attributeDetail.deleteValueDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('delete')}
        confirmDisabled={
          pendingDeleteValue != null && isAttributeValueDeleteBlocked(pendingDeleteValue)
        }
        onOpenChange={(open) => {
          if (!open) setPendingDeleteValue(null)
        }}
        onConfirm={() => {
          if (pendingDeleteValue && !isAttributeValueDeleteBlocked(pendingDeleteValue)) {
            void handleDeleteValue(pendingDeleteValue)
          }
        }}
      />
    </FeaturePage>
  )
}
