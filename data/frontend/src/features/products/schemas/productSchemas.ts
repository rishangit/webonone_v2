import { z } from 'zod'
import type { SelectTagValue } from '@webonone/ui-kit'

export type ProductAttributeRow = {
  attributeId: string
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
  attributeId: z.string(),
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

export function toCreateProductPayload(
  values: ProductWizardFormValues,
  options: {
    canSetStatus: boolean
    attributes: Array<{ id: string; valueType: string }>
  },
) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    status: options.canSetStatus ? values.status : 'pending',
    tag_ids: values.tags.map((tag) => tag.id),
    attributes: values.attributes
      .filter((row) => row.attributeId)
      .map((row) => {
        const attr = options.attributes.find((a) => a.id === row.attributeId)
        if (attr?.valueType === 'number') {
          return { attribute_id: row.attributeId, value_number: Number(row.valueNumber) }
        }
        return { attribute_id: row.attributeId, value_text: row.valueText }
      }),
  }
}
