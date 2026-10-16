import { z } from 'zod'
import type { SelectTagValue } from '@webonone/ui-kit'
import { catalogWizardAttributesToPayload } from '@/features/company-catalog/utils/catalogWizardAttributePayload'
import type { CatalogPayload } from '../types/companyCatalog.types'

export type ProductAttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

export type ProductWizardFormValues = {
  name: string
  description: string
  status: 'verified' | 'pending'
  tags: SelectTagValue[]
  attributes: ProductAttributeRow[]
}

export const EMPTY_PRODUCT_WIZARD_VALUES: ProductWizardFormValues = {
  name: '',
  description: '',
  status: 'pending',
  tags: [],
  attributes: [],
}

export const productWizardStep1Schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000),
  status: z.enum(['verified', 'pending']),
})

export const productWizardStep2Schema = z.object({
  tag_ids: z.array(z.string().length(21)).optional(),
})

export const productAttributeRowSchema = z.object({
  attributeId: z.string(),
  valueText: z.string(),
  valueNumber: z.string(),
})

export const productWizardStep3Schema = z.object({
  attributes: z.array(productAttributeRowSchema),
})

export type ProductWizardStep = 1 | 2 | 3 | 4

export function parseProductWizardStep(value: string | null | undefined): ProductWizardStep {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3 || n === 4) return n
  return 1
}

export function toCompanyProductPayload(
  values: ProductWizardFormValues,
  options: {
    canSetStatus: boolean
    attributes: Array<{ id: string; valueType: string }>
  },
): CatalogPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    ...(options.canSetStatus ? { status: values.status } : { status: 'pending' as const }),
    tagIds: values.tags.map((tag) => tag.id),
    attributes: catalogWizardAttributesToPayload(values.attributes, options.attributes),
  }
}

export function valuesFromProductPayload(
  payload: CatalogPayload | null | undefined,
  tags: SelectTagValue[] = [],
): ProductWizardFormValues {
  if (!payload) return { ...EMPTY_PRODUCT_WIZARD_VALUES, tags }

  const status =
    payload.status === 'verified' || payload.status === 'pending' ? payload.status : 'pending'
  const attrs = Array.isArray(payload.attributes) ? payload.attributes : []

  return {
    name: typeof payload.name === 'string' ? payload.name : '',
    description: typeof payload.description === 'string' ? payload.description : '',
    status,
    tags,
    attributes: attrs
      .filter(
        (row): row is { attributeId: string; valueText?: string | null; valueNumber?: number | null } =>
          !!row &&
          typeof row === 'object' &&
          typeof (row as { attributeId?: unknown }).attributeId === 'string',
      )
      .map((row) => ({
        attributeId: row.attributeId,
        valueText: row.valueText ?? '',
        valueNumber: row.valueNumber != null ? String(row.valueNumber) : '',
      })),
  }
}
