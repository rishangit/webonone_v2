import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeaturePage,
  StatusTag,
  type SelectTagValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { CatalogFormDialog } from '../components/CatalogFormDialog'
import { EditableSectionCard } from '../components/EditableSectionCard'
import { ServiceFormDialog } from '../components/ServiceFormDialog'
import type { ServiceWizardStep } from '../schemas/serviceSchemas'
import { dataLibraryApi } from '../services/dataLibraryApi'
import { companyCatalogActions } from '../store/companyCatalogStore'
import {
  bindingModeLabel,
  CATALOG_ENTITY_KINDS,
  CATALOG_ENTITY_LABELS,
  singularLabel,
  type CatalogEntityKind,
  type CatalogPayload,
} from '../types/companyCatalog.types'

function isCatalogEntityKind(value: string): value is CatalogEntityKind {
  return (CATALOG_ENTITY_KINDS as readonly string[]).includes(value)
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

type AttributeDisplay = {
  attributeId: string
  name: string
  value: string
}

export function CompanyCatalogDetailPage() {
  const { kind: kindParam = '', id = '' } = useParams()
  const kind = isCatalogEntityKind(kindParam) ? kindParam : null
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { detail, detailStatus, mutateStatus, mutateError } = useAppSelector((s) => s.companyCatalog)
  const [editOpen, setEditOpen] = useState(false)
  const [pendingEditClose, setPendingEditClose] = useState(false)
  const [serviceDialog, setServiceDialog] = useState<{ initialStep: ServiceWizardStep } | null>(
    null,
  )
  const [resolvedTags, setResolvedTags] = useState<SelectTagValue[]>([])
  const [resolvedAttributes, setResolvedAttributes] = useState<AttributeDisplay[]>([])

  const loading = detailStatus === 'loading'
  usePlatformLoading(
    loading && kind ? `Loading ${singularLabel(kind).toLowerCase()}…` : null,
  )

  useEffect(() => {
    if (!kind || !id) return
    dispatch(companyCatalogActions.detailRequested({ kind, id }))
    return () => {
      dispatch(companyCatalogActions.clearDetail())
    }
  }, [dispatch, kind, id])

  useEffect(() => {
    if (!pendingEditClose) return
    if (mutateStatus === 'idle' && !mutateError) {
      setEditOpen(false)
      setPendingEditClose(false)
    } else if (mutateStatus === 'error') {
      setPendingEditClose(false)
    }
  }, [mutateStatus, mutateError, pendingEditClose])

  useEffect(() => {
    if (kind !== 'services' || !detail) {
      setResolvedTags([])
      setResolvedAttributes([])
      return
    }

    const payload = detail.payload ?? detail.hydrated ?? null
    const tagIds = Array.isArray(payload?.tagIds)
      ? (payload.tagIds as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    const attrs = Array.isArray(payload?.attributes)
      ? (payload.attributes as Array<{
          attributeId?: string
          valueText?: string | null
          valueNumber?: number | null
        }>)
      : []

    let cancelled = false
    ;(async () => {
      let tags: SelectTagValue[] = []
      if (tagIds.length > 0) {
        try {
          const result = await dataLibraryApi.list('tags', { ids: tagIds, pageSize: tagIds.length })
          tags = result.items.map((item) => ({
            id: item.id,
            name: item.name,
            color: typeof item.color === 'string' ? item.color : '#2563EB',
          }))
        } catch {
          tags = tagIds.map((tagId) => ({ id: tagId, name: tagId, color: '#2563EB' }))
        }
      }

      const attrIds = attrs
        .map((row) => row.attributeId)
        .filter((v): v is string => typeof v === 'string')
      let attrDisplays: AttributeDisplay[] = []
      if (attrIds.length > 0) {
        try {
          const result = await dataLibraryApi.list('attributes', {
            ids: attrIds,
            pageSize: Math.min(100, attrIds.length),
          })
          const byId = new Map(result.items.map((item) => [item.id, item]))
          attrDisplays = attrs
            .filter((row): row is { attributeId: string; valueText?: string | null; valueNumber?: number | null } =>
              typeof row.attributeId === 'string',
            )
            .map((row) => {
              const lib = byId.get(row.attributeId)
              const value =
                row.valueNumber != null
                  ? String(row.valueNumber)
                  : row.valueText?.trim()
                    ? row.valueText
                    : '—'
              return {
                attributeId: row.attributeId,
                name: lib?.name ?? row.attributeId,
                value,
              }
            })
        } catch {
          attrDisplays = attrs
            .filter((row): row is { attributeId: string; valueText?: string | null; valueNumber?: number | null } =>
              typeof row.attributeId === 'string',
            )
            .map((row) => ({
              attributeId: row.attributeId,
              name: row.attributeId,
              value:
                row.valueNumber != null
                  ? String(row.valueNumber)
                  : row.valueText?.trim()
                    ? row.valueText
                    : '—',
            }))
        }
      }

      if (cancelled) return
      setResolvedTags(tags)
      setResolvedAttributes(attrDisplays)
    })()

    return () => {
      cancelled = true
    }
  }, [detail, kind])

  if (!kind) {
    return (
      <FeaturePage title="Not found" description="Unknown catalog type.">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
      </FeaturePage>
    )
  }

  const busy = mutateStatus === 'saving'
  const canEdit = detail?.bindingMode === 'forked' || detail?.bindingMode === 'custom'
  const canCustomize = detail?.bindingMode === 'linked' && detail.hydrated && !detail.libraryUnavailable
  const listPath = `/data/${kind}`
  const servicePayload = detail?.payload ?? detail?.hydrated ?? null

  return (
    <FeaturePage
      title={detail?.displayName ?? CATALOG_ENTITY_LABELS[kind]}
      description={
        detail?.bindingMode === 'linked'
          ? 'Live link to the Data library. Customize to keep a company-owned copy.'
          : detail?.libraryEntityId
            ? 'Company copy based on a library item.'
            : 'Company-owned catalog item.'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(listPath)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          {canCustomize ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!detail?.hydrated) return
                dispatch(
                  companyCatalogActions.forkRequested({
                    kind,
                    id,
                    payload: detail.hydrated,
                  }),
                )
              }}
              disabled={busy}
            >
              Customize
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              dispatch(companyCatalogActions.deleteRequested({ kind, id }))
              navigate(listPath)
            }}
          >
            Remove
          </Button>
        </div>
      }
    >
      {detail && kind === 'services' ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title="Service"
              description="Name and description"
              titleExtra={
                <StatusTag variant="verified">{bindingModeLabel(detail.bindingMode)}</StatusTag>
              }
              canEdit={canEdit && !busy}
              onEdit={() => setServiceDialog({ initialStep: 1 })}
            >
              <ReadOnlyField label="Name" value={detail.displayName} />
              <ReadOnlyField
                label="Description"
                value={detail.displayDescription?.trim() ? detail.displayDescription : '—'}
              />
              {detail.libraryUnavailable ? (
                <div className="text-destructive">Library item is unavailable right now.</div>
              ) : null}
            </EditableSectionCard>

            <EditableSectionCard
              title="Attributes"
              description="Custom attribute values for this service"
              canEdit={canEdit && !busy}
              onEdit={() => setServiceDialog({ initialStep: 4 })}
            >
              {resolvedAttributes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attributes.</p>
              ) : (
                resolvedAttributes.map((attr) => (
                  <ReadOnlyField key={attr.attributeId} label={attr.name} value={attr.value} />
                ))
              )}
            </EditableSectionCard>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
            <EditableSectionCard
              title="Time"
              description="How this service is scheduled"
              canEdit={canEdit && !busy}
              onEdit={() => setServiceDialog({ initialStep: 2 })}
            >
              <ReadOnlyField
                label="Time mode"
                value={
                  servicePayload?.timeMode === 'window'
                    ? 'Specific time'
                    : servicePayload?.timeMode === 'duration'
                      ? 'Duration'
                      : '—'
                }
              />
              {servicePayload?.timeMode === 'duration' ? (
                <ReadOnlyField
                  label="Duration"
                  value={
                    servicePayload.durationMinutes != null
                      ? `${String(servicePayload.durationMinutes)} minutes`
                      : '—'
                  }
                />
              ) : null}
              {servicePayload?.timeMode === 'window' ? (
                <>
                  <ReadOnlyField
                    label="Start time"
                    value={
                      typeof servicePayload.startTime === 'string' ? servicePayload.startTime : '—'
                    }
                  />
                  <ReadOnlyField
                    label="End time"
                    value={typeof servicePayload.endTime === 'string' ? servicePayload.endTime : '—'}
                  />
                </>
              ) : null}
            </EditableSectionCard>

            <EditableSectionCard
              title="Tags"
              description="Labels linked to this service"
              canEdit={canEdit && !busy}
              onEdit={() => setServiceDialog({ initialStep: 3 })}
            >
              {resolvedTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {resolvedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border px-2 py-0.5 text-xs"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </EditableSectionCard>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Provenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Mode</div>
                  <div>{bindingModeLabel(detail.bindingMode)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Library id</div>
                  <div className="break-all">{detail.libraryEntityId ?? '—'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {detail && kind !== 'services' ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <EditableSectionCard
              title="Details"
              titleExtra={
                <StatusTag variant="verified">{bindingModeLabel(detail.bindingMode)}</StatusTag>
              }
              canEdit={canEdit && !busy}
              onEdit={() => setEditOpen(true)}
            >
              <div>
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{detail.displayName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Description</div>
                <div>{detail.displayDescription || '—'}</div>
              </div>
              {detail.libraryUnavailable ? (
                <div className="text-destructive">Library item is unavailable right now.</div>
              ) : null}
            </EditableSectionCard>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Provenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Mode</div>
                  <div>{bindingModeLabel(detail.bindingMode)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Library id</div>
                  <div className="break-all">{detail.libraryEntityId ?? '—'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {kind === 'services' ? (
        <ServiceFormDialog
          open={serviceDialog != null}
          id={id}
          initialStep={serviceDialog?.initialStep ?? 1}
          onOpenChange={(next) => {
            if (!next) setServiceDialog(null)
          }}
          onSaved={() => {
            setServiceDialog(null)
            dispatch(companyCatalogActions.detailRequested({ kind: 'services', id }))
          }}
        />
      ) : (
        <CatalogFormDialog
          open={editOpen}
          kind={kind}
          mode="edit"
          initialPayload={detail?.payload}
          onOpenChange={setEditOpen}
          busy={busy}
          error={mutateError}
          onSubmit={(payload: CatalogPayload) => {
            dispatch(companyCatalogActions.clearMutateError())
            setPendingEditClose(true)
            dispatch(companyCatalogActions.updateRequested({ kind, id, payload }))
          }}
        />
      )}
    </FeaturePage>
  )
}
