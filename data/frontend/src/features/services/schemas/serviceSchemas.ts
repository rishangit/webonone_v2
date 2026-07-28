import { z } from 'zod'
import type { SelectTagValue } from '@webonone/ui-kit'

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm')

export const serviceTimeFormSchema = z
  .object({
    time_mode: z.enum(['duration', 'window'], {
      required_error: 'Time mode is required',
    }),
    duration_minutes: z.number().int().positive().optional().nullable(),
    start_time: timeOfDaySchema.optional().nullable(),
    end_time: timeOfDaySchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.time_mode === 'duration') {
      if (
        data.duration_minutes == null ||
        !Number.isInteger(data.duration_minutes) ||
        data.duration_minutes < 1
      ) {
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

export type ServiceTimeFormValues = z.infer<typeof serviceTimeFormSchema>
export type ServiceTimeMode = 'duration' | 'window'

export type ServiceAttributeRow = {
  attributeId: string
  valueText: string
  valueNumber: string
}

/** UI form state for the create/edit service wizard. */
export type ServiceWizardFormValues = {
  name: string
  description: string
  status: 'verified' | 'pending'
  time_mode: ServiceTimeMode
  duration_minutes: string
  start_time: string
  end_time: string
  tags: SelectTagValue[]
  attributes: ServiceAttributeRow[]
}

export const EMPTY_SERVICE_WIZARD_VALUES: ServiceWizardFormValues = {
  name: '',
  description: '',
  status: 'pending',
  time_mode: 'duration',
  duration_minutes: '60',
  start_time: '',
  end_time: '',
  tags: [],
  attributes: [],
}

export const serviceWizardStep1Schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().max(5000),
  status: z.enum(['verified', 'pending']),
})

export const serviceWizardStep2Schema = serviceTimeFormSchema

export const serviceWizardStep3Schema = z.object({
  tag_ids: z.array(z.string().length(21)).optional(),
})

export const serviceAttributeRowSchema = z.object({
  attributeId: z.string(),
  valueText: z.string(),
  valueNumber: z.string(),
})

export const serviceWizardStep4Schema = z.object({
  attributes: z.array(serviceAttributeRowSchema),
})

export const createServiceFormSchema = serviceWizardStep1Schema
  .and(serviceTimeFormSchema)
  .and(
    z.object({
      tag_ids: z.array(z.string().length(21)).optional(),
      attributes: z.array(serviceAttributeRowSchema).optional(),
    }),
  )

export type CreateServiceFormValues = z.infer<typeof createServiceFormSchema>

export type ServiceWizardStep = 1 | 2 | 3 | 4 | 5

export function parseServiceWizardStep(value: string | null | undefined): ServiceWizardStep {
  const n = Number(value)
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n
  return 1
}

export function buildServiceTimePayload(values: ServiceWizardFormValues) {
  return {
    time_mode: values.time_mode,
    duration_minutes:
      values.time_mode === 'duration' ? Number(values.duration_minutes) : null,
    start_time: values.time_mode === 'window' ? values.start_time || null : null,
    end_time: values.time_mode === 'window' ? values.end_time || null : null,
  }
}

export function toCreateServicePayload(
  values: ServiceWizardFormValues,
  options: {
    canSetStatus: boolean
    attributes: Array<{ id: string; valueType: string }>
  },
) {
  const time = buildServiceTimePayload(values)
  const timePayload =
    time.time_mode === 'duration'
      ? {
          time_mode: 'duration' as const,
          duration_minutes: time.duration_minutes,
          start_time: null,
          end_time: null,
        }
      : {
          time_mode: 'window' as const,
          duration_minutes: null,
          start_time: time.start_time,
          end_time: time.end_time,
        }

  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    status: options.canSetStatus ? values.status : 'pending',
    tag_ids: values.tags.map((tag) => tag.id),
    attributes: values.attributes
      .filter((row) => row.attributeId)
      .map((row) => ({
        attribute_id: row.attributeId,
      })),
    ...timePayload,
  }
}
