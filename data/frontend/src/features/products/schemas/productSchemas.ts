import { z } from 'zod'
import type { SelectTagValue } from '@webonone/ui-kit'

export type ProductAttributeUnit = {
  id: string
  name: string
  symbol: string
}

export type ProductAttributeRow = {
  attributeId: string
  name: string
  valueType: 'number' | 'text'
  unit: ProductAttributeUnit | null
  valueText: string
  valueNumber: string
}

/** UI form state for the create/edit product wizard. */
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
  attributeId: z.string().length(21),
  name: z.string(),
  valueType: z.enum(['number', 'text']),
  unit: z
    .object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
    })
    .nullable(),
  valueText: z.string(),
  valueNumber: z.string(),
})

export const productWizardStep3Schema = z.object({
  attributes: z.array(productAttributeRowSchema),
})

export const createProductFormSchema = productWizardStep1Schema.and(
  z.object({
    tag_ids: z.array(z.string().length(21)).optional(),
    attributes: z.array(productAttributeRowSchema).optional(),
  }),
)

export type CreateProductFormValues = z.infer<typeof createProductFormSchema>

export type ProductWizardStep = 1 | 2 | 3 | 4

export function parseProductWizardStep(value: string | null | undefined): ProductWizardStep {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3 || n === 4) return n
  return 1
}

export function toCreateProductPayload(values: ProductWizardFormValues, options: { canSetStatus: boolean }) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    status: options.canSetStatus ? values.status : 'pending',
    tag_ids: values.tags.map((tag) => tag.id),
    attributes: values.attributes.map((row) => ({
      attribute_id: row.attributeId,
    })),
  }
}
