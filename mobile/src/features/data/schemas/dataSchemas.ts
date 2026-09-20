import type { ZodIssue } from 'zod'
import { z } from 'zod'
import type { SelectTagValue } from '@webonone/mobile-ui'

export function mapZodIssuesToFieldErrors<T extends string>(
  issues: ZodIssue[],
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !errors[key as T]) {
      errors[key as T] = issue.message
    }
  }
  return errors
}

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be #RRGGBB'),
  status: z.enum(['verified', 'pending']),
})

export type TagFormValues = z.infer<typeof tagFormSchema>

export const unitFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  symbol: z.string().trim().min(1, 'Symbol is required').max(32),
  isBase: z.boolean(),
  baseUnitId: z.string().optional(),
  status: z.enum(['verified', 'pending']),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>

export const attributeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  valueType: z.enum(['number', 'text']),
  unitId: z.string().optional(),
  status: z.enum(['verified', 'pending']),
})

export type AttributeFormValues = z.infer<typeof attributeFormSchema>

export const spaceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(['verified', 'pending']),
})

export type SpaceFormValues = z.infer<typeof spaceFormSchema>

export type ProductAttributeRow = {
  attributeId: string
  name: string
  valueType: 'number' | 'text'
}

export type ProductWizardFormValues = {
  name: string
  description: string
  status: 'verified' | 'pending'
  tags: SelectTagValue[]
  attributes: ProductAttributeRow[]
}

export const productWizardStep1Schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000),
  status: z.enum(['verified', 'pending']),
})

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm')

export const serviceTimeFormSchema = z
  .object({
    time_mode: z.enum(['duration', 'window']),
    duration_minutes: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.time_mode === 'duration') {
      const minutes = Number(data.duration_minutes)
      if (!Number.isInteger(minutes) || minutes < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Duration (minutes) is required',
          path: ['duration_minutes'],
        })
      }
      return
    }
    if (!data.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time is required',
        path: ['start_time'],
      })
    }
    if (!data.end_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time is required',
        path: ['end_time'],
      })
    }
    if (data.start_time && data.end_time && data.end_time <= data.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['end_time'],
      })
    }
  })

export type ServiceWizardFormValues = {
  name: string
  description: string
  status: 'verified' | 'pending'
  time_mode: 'duration' | 'window'
  duration_minutes: string
  start_time: string
  end_time: string
  tags: SelectTagValue[]
  attributes: ProductAttributeRow[]
}

export function toCreateProductPayload(
  values: ProductWizardFormValues,
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

export function toCreateServicePayload(
  values: ServiceWizardFormValues,
  options: { canSetStatus: boolean },
) {
  const timePayload =
    values.time_mode === 'duration'
      ? {
          time_mode: 'duration' as const,
          duration_minutes: Number(values.duration_minutes),
          start_time: null,
          end_time: null,
        }
      : {
          time_mode: 'window' as const,
          duration_minutes: null,
          start_time: values.start_time || null,
          end_time: values.end_time || null,
        }

  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    status: options.canSetStatus ? values.status : 'pending',
    tag_ids: values.tags.map((tag) => tag.id),
    attributes: values.attributes.map((row) => ({
      attribute_id: row.attributeId,
    })),
    ...timePayload,
  }
}

export function toCreateSpacePayload(
  values: SpaceFormValues & { tags: SelectTagValue[] },
  options: { canSetStatus: boolean },
) {
  return {
    name: values.name.trim(),
    description: (values.description ?? '').trim() || null,
    status: options.canSetStatus ? values.status : 'pending',
    tag_ids: values.tags.map((tag) => tag.id),
  }
}
