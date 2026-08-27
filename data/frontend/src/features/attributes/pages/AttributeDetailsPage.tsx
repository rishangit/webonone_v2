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
import { AttributeFormDialog } from '@/features/attributes/components/AttributeFormDialog'
import { CopyToAiButton } from '@/features/shell/components/CopyToAiButton'
import { attributesActions } from '@/features/attributes/store'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { EditableSectionCard } from '@/shared/components/EditableSectionCard'
import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export function AttributeDetailsPage() {
  const { t } = useTranslation('attributes')
  const { attributeId } = useParams<{ attributeId: string }>()
  const { goToList, goToDetail } = useNavigateDataEntity()
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.attributes)
  const canEdit = user?.role === 'super_admin'
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!attributeId) return
    dispatch(attributesActions.fetchDetailRequested({ id: attributeId }))
  }, [dispatch, attributeId])

  const attribute = detail?.id === attributeId ? detail : null
  usePlatformLoading(
    !attribute && detailStatus !== 'error' ? t('loadingDetail') : null,
  )

  if (!accessToken) return <Navigate to="/login" replace />
  if (!attributeId) return <Navigate to="/attributes" replace />

  const unitLabel = attribute?.unit
    ? `${attribute.unit.name} (${attribute.unit.symbol})`
    : t('noUnit')

  return (
    <FeaturePage
      title={attribute?.name ?? t('singular')}
      description={t('details')}
      onBack={() => goToList('attributes')}
      backLabel={t('common:back')}
      actions={
        attribute ? <CopyToAiButton kind="attribute" id={attribute.id} label={attribute.name} /> : undefined
      }
    >
      {detailError ? (
        <Alert variant="destructive">
          <AlertDescription>{detailError}</AlertDescription>
        </Alert>
      ) : null}

      {attribute ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title={t('singular')}
              description={t('sectionDescription')}
              status={attribute.status}
              canEdit={canEdit}
              onEdit={() => setEditOpen(true)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{attribute.name}</h2>
              </div>
              <ReadOnlyField
                label={t('descriptionLabel')}
                value={attribute.description?.trim() ? attribute.description : t('noDescription')}
              />
              <ReadOnlyField
                label={t('valueType')}
                value={attribute.valueType === 'number' ? t('number') : t('text')}
              />
              <ReadOnlyField
                label={t('unit')}
                value={
                  attribute.unit ? (
                    <button
                      type="button"
                      className="rounded-md text-left underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => goToDetail('units', attribute.unit!.id)}
                    >
                      {unitLabel}
                    </button>
                  ) : (
                    t('noUnit')
                  )
                }
              />
            </EditableSectionCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('metadata')}</CardTitle>
                <CardDescription>{t('metaDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReadOnlyField label={t('created')} value={formatDisplayDateTime(attribute.createdAt)} />
                <ReadOnlyField label={t('updated')} value={formatDisplayDateTime(attribute.updatedAt)} />
                <ReadOnlyField
                  label={t('references')}
                  value={String(attribute.referenceCount ?? 0)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {editOpen && attributeId ? (
        <AttributeFormDialog
          open
          id={attributeId}
          onOpenChange={(open) => {
            if (!open) setEditOpen(false)
          }}
          onSaved={() => {
            dispatch(attributesActions.fetchDetailRequested({ id: attributeId, force: true }))
            setEditOpen(false)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
