import { z } from 'zod'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

export type ProductVariantKind = 'default' | 'custom'

export type ProductVariantWizardStep = 1 | 2 | 3

export type ProductVariantWizardFormValues = {
  kind: ProductVariantKind
  /** attributeId → selected product attribute value id (custom multi-value attrs) */
  selectedValueByAttributeId: Record<string, string>
  name: string
  sku: string
}

export const EMPTY_PRODUCT_VARIANT_WIZARD_VALUES: ProductVariantWizardFormValues = {
  kind: 'default',
  selectedValueByAttributeId: {},
  name: '',
  sku: '',
}

export function parseProductVariantWizardStep(
  value: string | null | undefined,
): ProductVariantWizardStep {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3) return n
  return 1
}

export function multiValueAttributes(attributes: CatalogAttributeValue[]): CatalogAttributeValue[] {
  return attributes.filter((attr) => attr.values.length >= 2)
}

export function formatAttributeValueLabel(
  value: { valueText: string | null; valueNumber: number | null },
  unitSymbol?: string | null,
): string {
  const base =
    value.valueText != null && value.valueText !== ''
      ? value.valueText
      : value.valueNumber != null
        ? String(value.valueNumber)
        : '—'
  return unitSymbol ? `${base} ${unitSymbol}` : base
}

export function productVariantWizardStep1Schema(attributes: CatalogAttributeValue[]) {
  const multi = multiValueAttributes(attributes)
  return z
    .object({
      kind: z.enum(['default', 'custom']),
      selectedValueByAttributeId: z.record(z.string(), z.string()),
    })
    .superRefine((data, ctx) => {
      if (data.kind !== 'custom') return
      for (const attr of multi) {
        const selected = data.selectedValueByAttributeId[attr.attributeId]
        if (!selected || !attr.values.some((value) => value.id === selected)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Select a value for ${attr.name}`,
            path: ['selectedValueByAttributeId', attr.attributeId],
          })
        }
      }
    })
}

export const productVariantWizardStep2Schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  sku: z.string().trim().min(1, 'SKU is required').max(255),
})

export function toCreateProductVariantPayload(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
): {
  name: string
  sku: string
  kind: ProductVariantKind
  attribute_value_ids: string[]
} {
  const attribute_value_ids =
    values.kind === 'custom'
      ? multiValueAttributes(attributes)
          .map((attr) => values.selectedValueByAttributeId[attr.attributeId])
          .filter((id): id is string => Boolean(id))
      : []

  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    kind: values.kind,
    attribute_value_ids,
  }
}

/** Suggest a variant name from the chosen attribute values. */
export function suggestVariantName(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
): string {
  const rows = resolveWizardAttributeValues(values, attributes)
  if (rows.length === 0) {
    return values.kind === 'default' ? 'Default' : 'Custom'
  }
  return rows.map((row) => `${row.attributeName}: ${row.label}`).join(' · ').slice(0, 255)
}

/** Generate a SKU from product name + short random suffix. */
export function generateVariantSku(productName: string): string {
  const slug = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return slug ? `${slug}-${suffix}` : suffix
}

export function resolveWizardAttributeValues(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
): Array<{ attributeName: string; label: string }> {
  const result: Array<{ attributeName: string; label: string }> = []

  if (values.kind === 'default') {
    for (const attr of attributes) {
      if (attr.values.length === 0) continue
      const defaultValue = attr.values.find((value) => value.isDefault) ?? attr.values[0]
      if (!defaultValue) continue
      result.push({
        attributeName: attr.name,
        label: formatAttributeValueLabel(defaultValue, attr.unit?.symbol),
      })
    }
    return result
  }

  for (const attr of attributes) {
    if (attr.values.length === 0) continue
    if (attr.values.length === 1) {
      const only = attr.values[0]!
      result.push({
        attributeName: attr.name,
        label: formatAttributeValueLabel(only, attr.unit?.symbol),
      })
      continue
    }
    const selectedId = values.selectedValueByAttributeId[attr.attributeId]
    const selected = attr.values.find((value) => value.id === selectedId)
    if (!selected) continue
    result.push({
      attributeName: attr.name,
      label: formatAttributeValueLabel(selected, attr.unit?.symbol),
    })
  }
  return result
}

/** Sorted attribute-value ids that would be stored for this wizard selection. */
export function resolveWizardAttributeValueIds(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
): string[] {
  const ids: string[] = []

  if (values.kind === 'default') {
    for (const attr of attributes) {
      if (attr.values.length === 0) continue
      const defaultValue = attr.values.find((value) => value.isDefault) ?? attr.values[0]
      if (defaultValue) ids.push(defaultValue.id)
    }
    return ids.sort()
  }

  for (const attr of attributes) {
    if (attr.values.length === 0) continue
    if (attr.values.length === 1) {
      ids.push(attr.values[0]!.id)
      continue
    }
    const selectedId = values.selectedValueByAttributeId[attr.attributeId]
    if (selectedId) ids.push(selectedId)
  }
  return ids.sort()
}

function combinationKey(valueIds: string[]): string {
  return [...valueIds].sort().join('|')
}

export function isDuplicateVariantCombination(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
  existingVariants: Array<{ values: Array<{ attributeValueId: string }> }>,
): boolean {
  const nextKey = combinationKey(resolveWizardAttributeValueIds(values, attributes))
  return existingVariants.some(
    (variant) =>
      combinationKey(variant.values.map((value) => value.attributeValueId)) === nextKey,
  )
}
