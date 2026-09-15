import { z } from 'zod'

const polishFieldSchema = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    label: z.string().trim().min(1).max(255).optional(),
    control: z.enum(['input', 'textarea']).optional(),
  })
  .strict()

const polishFormFieldSchema = z
  .object({
    label: z.string().trim().min(1).max(255),
    name: z.string().trim().min(1).max(128).optional(),
    value: z.string().max(2000),
  })
  .strict()

export const polishTextSchema = z
  .object({
    text: z.string().trim().min(1).max(8000),
    field: polishFieldSchema.optional(),
    form: z
      .object({
        fields: z.array(polishFormFieldSchema).max(40),
      })
      .strict()
      .optional(),
  })
  .strict()

export type PolishTextBody = z.infer<typeof polishTextSchema>
