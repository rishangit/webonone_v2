import { z } from 'zod'

export const catalogEntityKindSchema = z.enum([
  'tags',
  'units',
  'attributes',
  'products',
  'services',
  'spaces',
])

export const catalogBindingModeSchema = z.enum(['linked', 'forked', 'custom'])

export const entityStatusSchema = z.enum(['verified', 'pending'])
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be #RRGGBB')
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm')

const attributeValueSchema = z
  .object({
    attributeId: z.string().length(21),
    valueText: z.string().optional().nullable(),
    valueNumber: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasText = data.valueText != null && data.valueText !== ''
    const hasNumber = data.valueNumber != null
    if (hasText === hasNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide exactly one of valueText or valueNumber',
        path: ['valueText'],
      })
    }
  })

const tagPayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  color: hexColorSchema,
  status: entityStatusSchema.optional(),
})

const unitPayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  symbol: z.string().trim().min(1).max(32),
  isBase: z.boolean().optional(),
  baseUnitId: z.string().length(21).optional().nullable(),
  status: entityStatusSchema.optional(),
})

const attributePayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  valueType: z.enum(['number', 'text']),
  unitId: z.string().length(21).optional().nullable(),
  status: entityStatusSchema.optional(),
})

const catalogBasePayloadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  status: entityStatusSchema.optional(),
  tagIds: z.array(z.string().length(21)).optional(),
  attributes: z.array(attributeValueSchema).optional(),
})

function refineServiceTime(
  data: {
    timeMode?: 'duration' | 'window'
    durationMinutes?: number | null
    startTime?: string | null
    endTime?: string | null
  },
  ctx: z.RefinementCtx,
  options: { requireMode: boolean },
) {
  if (data.timeMode === undefined) {
    if (
      options.requireMode ||
      data.durationMinutes !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'timeMode is required',
        path: ['timeMode'],
      })
    }
    return
  }

  if (data.timeMode === 'duration') {
    if (
      data.durationMinutes == null ||
      !Number.isInteger(data.durationMinutes) ||
      data.durationMinutes < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'durationMinutes must be a positive integer',
        path: ['durationMinutes'],
      })
    }
    return
  }

  if (!data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startTime is required',
      path: ['startTime'],
    })
  }
  if (!data.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime is required',
      path: ['endTime'],
    })
  }
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endTime must be after startTime',
      path: ['endTime'],
    })
  }
}

const servicePayloadSchema = catalogBasePayloadSchema
  .extend({
    timeMode: z.enum(['duration', 'window']),
    durationMinutes: z.number().int().positive().optional().nullable(),
    startTime: timeOfDaySchema.optional().nullable(),
    endTime: timeOfDaySchema.optional().nullable(),
  })
  .superRefine((data, ctx) => refineServiceTime(data, ctx, { requireMode: true }))

const productOrSpacePayloadSchema = catalogBasePayloadSchema

export const catalogPayloadByKind = {
  tags: tagPayloadSchema,
  units: unitPayloadSchema,
  attributes: attributePayloadSchema,
  products: productOrSpacePayloadSchema,
  services: servicePayloadSchema,
  spaces: productOrSpacePayloadSchema,
} as const

export type CatalogEntityKind = z.infer<typeof catalogEntityKindSchema>
export type CatalogBindingMode = z.infer<typeof catalogBindingModeSchema>
export type CatalogPayload = z.infer<(typeof catalogPayloadByKind)[CatalogEntityKind]>

export const linkCatalogBodySchema = z.object({
  libraryEntityId: z.string().length(21),
})

export const fromLibraryBodySchema = z
  .object({
    libraryEntityId: z.string().length(21),
    mode: z.enum(['linked', 'forked']),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'forked' && data.payload == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'payload is required when mode is forked',
        path: ['payload'],
      })
    }
  })

export const forkCatalogBodySchema = z.object({
  payload: z.record(z.string(), z.unknown()),
})

export type CatalogGalleryImage = {
  mediaId: string
  url: string
}

const galleryImageSchema = z.object({
  mediaId: z.string().min(1).max(64),
  url: z.string().url().max(2048),
})

export const updateCatalogGalleryBodySchema = z.object({
  galleryImages: z.array(galleryImageSchema).max(24),
})

export type UpdateCatalogGalleryBody = z.infer<typeof updateCatalogGalleryBodySchema>

/** Kinds that support a company-owned media gallery on the detail page. */
export const CATALOG_GALLERY_KINDS = ['services', 'spaces'] as const
export type CatalogGalleryKind = (typeof CATALOG_GALLERY_KINDS)[number]

export function isCatalogGalleryKind(kind: CatalogEntityKind): kind is CatalogGalleryKind {
  return (CATALOG_GALLERY_KINDS as readonly string[]).includes(kind)
}

export function parsePayloadForKind(
  kind: CatalogEntityKind,
  payload: unknown,
): CatalogPayload {
  return catalogPayloadByKind[kind].parse(payload) as CatalogPayload
}

export function parsePartialPayloadForKind(
  kind: CatalogEntityKind,
  payload: unknown,
  current: CatalogPayload,
): CatalogPayload {
  const merged =
    payload && typeof payload === 'object'
      ? { ...current, ...(payload as Record<string, unknown>) }
      : current
  return parsePayloadForKind(kind, merged)
}
