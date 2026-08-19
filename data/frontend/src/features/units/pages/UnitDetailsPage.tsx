import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FeaturePage,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { UnitFormDialog } from '@/features/units/components/UnitFormDialog'
import { unitsActions } from '@/features/units/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { dataApi } from '@/shared/services/dataApi'
import type { Unit } from '@/shared/types/data.types'

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function UnitDetailsPage() {
  const { t } = useTranslation('units')
  const { unitId } = useParams<{ unitId: string }>()
  const { goToList, goToDetail } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.units)
  const canEdit = user?.role === 'super_admin'
  const [editOpen, setEditOpen] = useState(false)
  const [baseUnit, setBaseUnit] = useState<Unit | null>(null)

  useEffect(() => {
    if (!unitId) return
    dispatch(unitsActions.fetchDetailRequested({ id: unitId }))
  }, [dispatch, unitId])

  const unit = detail?.id === unitId ? detail : null

  useEffect(() => {
    if (!unit?.baseUnitId || unit.isBase) {
      setBaseUnit(null)
      return
    }
    let cancelled = false
    void dataApi.getUnit(unit.baseUnitId).then((result) => {
      if (!cancelled) setBaseUnit(result)
    }).catch(() => {
      if (!cancelled) setBaseUnit(null)
    })
    return () => {
      cancelled = true
    }
  }, [unit?.baseUnitId, unit?.isBase])

  usePlatformLoading(
    !unit && detailStatus !== 'error' ? t('loadingDetail') : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!unitId) return <Navigate to="/units" replace />

  const baseUnitLabel = baseUnit
    ? t('nameWithSymbol', { name: baseUnit.name, symbol: baseUnit.symbol })
    : unit?.baseUnitId ?? t('noDescription')

  return (
    <FeaturePage
      title={unit?.name ?? t('singular')}
      description={t('details')}
      onBack={() => goToList('units')}
      backLabel={t('common:back')}
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {unit ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title={t('singular')}
              description={t('sectionDescription')}
              canEdit={canEdit}
              onEdit={() => setEditOpen(true)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {t('nameWithSymbol', { name: unit.name, symbol: unit.symbol })}
                </h2>
                <StatusBadge status={unit.status} />
              </div>
              <ReadOnlyField
                label={t('descriptionLabel')}
                value={unit.description?.trim() ? unit.description : t('noDescription')}
              />
              <ReadOnlyField label={t('symbol')} value={unit.symbol} />
              <ReadOnlyField
                label={t('kind')}
                value={unit.isBase ? t('baseUnitKind') : t('derivedKind')}
              />
              {!unit.isBase ? (
                <ReadOnlyField
                  label={t('baseUnit')}
                  value={
                    unit.baseUnitId ? (
                      <button
                        type="button"
                        className="rounded-md text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => goToDetail('units', unit.baseUnitId!)}
                      >
                        {baseUnitLabel}
                      </button>
                    ) : (
                      t('noDescription')
                    )
                  }
                />
              ) : null}
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('metadata')}</CardTitle>
                <CardDescription>{t('metaDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('created')} value={formatTimestamp(unit.createdAt)} />
                <ReadOnlyField label={t('updated')} value={formatTimestamp(unit.updatedAt)} />
                <ReadOnlyField
                  label={t('references')}
                  value={String(unit.referenceCount ?? 0)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {editOpen && unitId ? (
        <UnitFormDialog
          open
          id={unitId}
          onOpenChange={(open) => {
            if (!open) setEditOpen(false)
          }}
          onSaved={() => {
            dispatch(unitsActions.fetchDetailRequested({ id: unitId, force: true }))
            setEditOpen(false)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
