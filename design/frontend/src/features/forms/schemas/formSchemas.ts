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
    required: z.boolean().optional(),
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

export const formCreateMetaSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(128)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens'),
})

export type FormCreateMetaValues = z.infer<typeof formCreateMetaSchema>
