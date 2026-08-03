import { z } from 'zod'

export const formFieldOptionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(255),
})

export const formFieldTypeSchema = z.enum(['text', 'textarea', 'checkbox', 'radio', 'select'])

export const formFieldSchema = z
  .object({
    id: z.string().min(1).max(64),
    type: formFieldTypeSchema,
    label: z.string().min(1).max(255),
    required: z.boolean().optional().default(false),
    placeholder: z.string().max(255).optional(),
    options: z.array(formFieldOptionSchema).max(50).optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === 'radio' || field.type === 'select') {
      if (!field.options || field.options.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Radio and dropdown fields require at least one option',
          path: ['options'],
        })
      }
    }
  })

export const formDefinitionSchema = z.object({
  version: z.literal(1),
  fields: z.array(formFieldSchema).max(200),
})

export const formStatusSchema = z.enum(['draft', 'published'])

export const createFormSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  definition: formDefinitionSchema.optional().default({ version: 1, fields: [] }),
  status: formStatusSchema.optional().default('draft'),
})

export const updateFormSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(128)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
      .optional(),
    definition: formDefinitionSchema.optional(),
    status: formStatusSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' })

export type FormDefinition = z.infer<typeof formDefinitionSchema>
export type CreateFormBody = z.infer<typeof createFormSchema>
export type UpdateFormBody = z.infer<typeof updateFormSchema>
