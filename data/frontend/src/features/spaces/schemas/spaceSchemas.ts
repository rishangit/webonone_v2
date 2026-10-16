import { z } from 'zod'
import type { SelectTagValue } from '@webonone/ui-kit'

export type SpaceAttributeUnit = {
  id: string
  name: string
  symbol: string
}

export type SpaceAttributeRow = {
  attributeId: string
  name: string
  description?: string | null
  valueType: 'number' | 'text'
  unit: SpaceAttributeUnit | null
  valueText: string
  valueNumber: string
}

/** UI form state for the create/edit space wizard. */
export type SpaceWizardFormValues = {
  name: string
  description: string
  status: 'verified' | 'pending'
  tags: SelectTagValue[]
  attributes: SpaceAttributeRow[]
}

export const EMPTY_SPACE_WIZARD_VALUES: SpaceWizardFormValues = {
  name: '',
  description: '',
  status: 'pending',
  tags: [],
  attributes: [],
}

export const spaceWizardStep1Schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000),
  status: z.enum(['verified', 'pending']),
})

export const spaceWizardStep2Schema = z.object({
  tag_ids: z.array(z.string().length(21)).optional(),
})

export const spaceAttributeRowSchema = z.object({
  attributeId: z.string().length(21),
  name: z.string(),
  description: z.string().nullable().optional(),
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

export const spaceWizardStep3Schema = z.object({
  attributes: z.array(spaceAttributeRowSchema),
})

export type SpaceWizardStep = 1 | 2 | 3 | 4

export function parseSpaceWizardStep(value: string | null | undefined): SpaceWizardStep {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3 || n === 4) return n
  return 1
}

export function toCreateSpacePayload(
  values: SpaceWizardFormValues,
  options: { canSetStatus: boolean },
) {
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
