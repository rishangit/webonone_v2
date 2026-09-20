import { z } from 'zod'
import type { CatalogAttributeValue } from '@/shared/types/data.types'

export type ProductVariantKind = 'default' | 'custom'

export type ProductVariantWizardStep = 1 | 2 | 3

export type ProductVariantWizardFormValues = {
  kind: ProductVariantKind
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

export function suggestVariantName(
  values: ProductVariantWizardFormValues,
  attributes: CatalogAttributeValue[],
): string {
  if (values.kind === 'default') return 'Default'
  const rows = multiValueAttributes(attributes)
    .map((attr) => {
      const selected = attr.values.find(
        (value) => value.id === values.selectedValueByAttributeId[attr.attributeId],
      )
      if (!selected) return null
      return `${attr.name}: ${formatAttributeValueLabel(selected, attr.unit?.symbol)}`
    })
    .filter((row): row is string => Boolean(row))
  if (rows.length === 0) return 'Custom'
  return rows.join(' · ').slice(0, 255)
}

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
