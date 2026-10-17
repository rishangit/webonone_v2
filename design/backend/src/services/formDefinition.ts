import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  formDefinitionSchema,
  formFieldSchema,
  formFieldTypeSchema,
  type FormDefinition,
} from '../schemas/formSchemas.js'
import { HttpError } from './httpError.js'

const looseOptionSchema = z.union([
  z.string().trim().min(1).max(255),
  z.object({
    id: z.string().min(1).max(64).optional(),
    label: z.string().trim().min(1).max(255),
  }),
])

const looseFieldSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  type: formFieldTypeSchema,
  label: z.string().trim().min(1).max(255),
  required: z.boolean().optional(),
  placeholder: z.string().max(255).optional(),
  allowMultiple: z.boolean().optional(),
  options: z.array(looseOptionSchema).max(50).optional(),
})

const looseDefinitionSchema = z.object({
  version: z.literal(1),
  fields: z.array(looseFieldSchema).max(200),
})

export const patchFormFieldBodySchema = z
  .object({
    label: z.string().trim().min(1).max(255).optional(),
    required: z.boolean().optional(),
    placeholder: z.string().max(255).optional(),
    allowMultiple: z.boolean().optional(),
    options: z.array(looseOptionSchema).max(50).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one setting is required' })

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionFromLoose(option: z.infer<typeof looseOptionSchema>): { id: string; label: string } {
  if (typeof option === 'string') {
    return { id: nanoid(8), label: option }
  }
  return { id: option.id ?? nanoid(8), label: option.label }
}

function materializeField(field: z.infer<typeof looseFieldSchema>) {
  const options = field.options?.map(optionFromLoose)
  return formFieldSchema.parse({
    id: field.id ?? nanoid(10),
    type: field.type,
    label: field.label,
    required: field.required ?? false,
    ...(field.placeholder != null ? { placeholder: field.placeholder } : {}),
    ...(field.type === 'media' && field.allowMultiple != null
      ? { allowMultiple: field.allowMultiple }
      : {}),
    ...(options ? { options } : {}),
  })
}

export function definitionFromLoose(raw: unknown): FormDefinition {
  const parsed = looseDefinitionSchema.parse(raw)
  return formDefinitionSchema.parse({
    version: 1,
    fields: parsed.fields.map(materializeField),
  })
}

/** Map an AI `fields` array onto `definition` and fill missing field and option ids. */
export function normalizeCreateFormBody(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw
  }
  const next: Record<string, unknown> = { ...raw }
  if (next.definition == null && Array.isArray(next.fields)) {
    next.definition = { version: 1, fields: next.fields }
    delete next.fields
  }
  if (next.definition != null) {
    next.definition = definitionFromLoose(next.definition)
  }
  return next
}

export function appendFormField(definition: FormDefinition, raw: unknown): FormDefinition {
  const field = materializeField(looseFieldSchema.parse(raw))
  return formDefinitionSchema.parse({
    version: 1,
    fields: [...definition.fields, field],
  })
}

export function patchFormField(
  definition: FormDefinition,
  fieldId: string,
  raw: unknown,
): FormDefinition {
  const patch = patchFormFieldBodySchema.parse(raw)
  const index = definition.fields.findIndex((field) => field.id === fieldId)
  if (index < 0) {
    throw new HttpError(404, 'Form field not found', 'FORM_FIELD_NOT_FOUND')
  }
  const current = definition.fields[index]
  if (!current) {
    throw new HttpError(404, 'Form field not found', 'FORM_FIELD_NOT_FOUND')
  }
  const options = patch.options?.map(optionFromLoose)
  const next = formFieldSchema.parse({
    ...current,
    ...(patch.label != null ? { label: patch.label } : {}),
    ...(patch.required != null ? { required: patch.required } : {}),
    ...(patch.placeholder != null ? { placeholder: patch.placeholder } : {}),
    ...(current.type === 'media' && patch.allowMultiple != null
      ? { allowMultiple: patch.allowMultiple }
      : {}),
    ...(options ? { options } : {}),
  })
  const fields = definition.fields.slice()
  fields[index] = next
  return formDefinitionSchema.parse({ version: 1, fields })
}
