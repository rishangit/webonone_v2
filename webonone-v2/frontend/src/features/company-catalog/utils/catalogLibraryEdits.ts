import type { CatalogEntityKind, CatalogPayload } from '@/features/company-catalog/types/companyCatalog.types'
import type { ProductWizardFormValues } from '@/features/company-catalog/schemas/productSchemas'
import type { ServiceWizardFormValues } from '@/features/company-catalog/schemas/serviceSchemas'

export type CatalogEditedField =
  | 'name'
  | 'description'
  | 'timeMode'
  | 'duration'
  | 'timeWindow'
  | 'tags'
  | 'attributes'

function normText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normTagIds(payload: CatalogPayload | null): string[] {
  const raw = payload?.tagIds
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((id): id is string => typeof id === 'string'))].sort()
}

function attributeSignature(payload: CatalogPayload | null): string {
  const rows = payload?.attributes
  if (!Array.isArray(rows)) return ''
  return JSON.stringify(
    rows
      .filter((row) => row && typeof row === 'object')
      .map((row) => {
        const record = row as Record<string, unknown>
        return {
          attributeId: record.attributeId,
          valueText: record.valueText ?? null,
          valueNumber: record.valueNumber ?? null,
        }
      })
      .sort((a, b) => String(a.attributeId).localeCompare(String(b.attributeId))),
  )
}

export function catalogEditedFieldsFromPayload(
  kind: CatalogEntityKind,
  current: CatalogPayload | null,
  baseline: CatalogPayload | null,
): Set<CatalogEditedField> {
  const edited = new Set<CatalogEditedField>()
  if (!current || !baseline) return edited

  if (normText(current.name) !== normText(baseline.name)) edited.add('name')
  if (normText(current.description) !== normText(baseline.description)) edited.add('description')

  if (kind === 'services') {
    const timeMode = current.timeMode === 'window' ? 'window' : 'duration'
    const baseMode = baseline.timeMode === 'window' ? 'window' : 'duration'
    if (timeMode !== baseMode) edited.add('timeMode')

    if (timeMode === 'duration') {
      const minutes = Number(current.durationMinutes)
      const baseMinutes = Number(baseline.durationMinutes)
      if (minutes !== baseMinutes) edited.add('duration')
    } else {
      const start = normText(current.startTime)
      const end = normText(current.endTime)
      const baseStart = normText(baseline.startTime)
      const baseEnd = normText(baseline.endTime)
      if (start !== baseStart || end !== baseEnd) edited.add('timeWindow')
    }
  }

  const tagIds = normTagIds(current)
  const baseTagIds = normTagIds(baseline)
  if (tagIds.join(',') !== baseTagIds.join(',')) edited.add('tags')

  if (attributeSignature(current) !== attributeSignature(baseline)) edited.add('attributes')

  return edited
}

export function productWizardEditedFields(
  values: ProductWizardFormValues,
  baseline: CatalogPayload | null,
): Set<CatalogEditedField> {
  const payload: CatalogPayload = {
    name: values.name,
    description: values.description.trim() || null,
    tagIds: values.tags.map((tag) => tag.id),
    attributes: values.attributes
      .filter((row) => row.attributeId)
      .map((row) => ({
        attributeId: row.attributeId,
        valueText: row.valueText.trim() || null,
        valueNumber: row.valueNumber.trim() === '' ? null : Number(row.valueNumber),
      })),
  }
  return catalogEditedFieldsFromPayload('products', payload, baseline)
}

export function serviceWizardEditedFields(
  values: ServiceWizardFormValues,
  baseline: CatalogPayload | null,
): Set<CatalogEditedField> {
  const payload: CatalogPayload = {
    name: values.name,
    description: values.description.trim() || null,
    timeMode: values.time_mode,
    durationMinutes:
      values.time_mode === 'duration' ? Number(values.duration_minutes) : null,
    startTime: values.time_mode === 'window' ? values.start_time || null : null,
    endTime: values.time_mode === 'window' ? values.end_time || null : null,
    tagIds: values.tags.map((tag) => tag.id),
    attributes: values.attributes
      .filter((row) => row.attributeId)
      .map((row) => ({
        attributeId: row.attributeId,
        valueText: row.valueText.trim() || null,
        valueNumber: row.valueNumber.trim() === '' ? null : Number(row.valueNumber),
      })),
  }
  return catalogEditedFieldsFromPayload('services', payload, baseline)
}
