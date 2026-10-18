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
export const webPublishStatusSchema = z.enum(['draft', 'completed', 'published'])
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

const sellableWebPublishField = {
  webPublishStatus: webPublishStatusSchema.optional(),
}

const servicePayloadSchema = catalogBasePayloadSchema
  .extend({
    timeMode: z.enum(['duration', 'window']),
    durationMinutes: z.number().int().positive().optional().nullable(),
    startTime: timeOfDaySchema.optional().nullable(),
    endTime: timeOfDaySchema.optional().nullable(),
    ...sellableWebPublishField,
  })
  .superRefine((data, ctx) => refineServiceTime(data, ctx, { requireMode: true }))

const productPayloadSchema = catalogBasePayloadSchema.extend({
  ...sellableWebPublishField,
})

const spacePayloadSchema = catalogBasePayloadSchema.extend({
  ...sellableWebPublishField,
})

export const catalogPayloadByKind = {
  tags: tagPayloadSchema,
  units: unitPayloadSchema,
  attributes: attributePayloadSchema,
  products: productPayloadSchema,
  services: servicePayloadSchema,
  spaces: spacePayloadSchema,
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

export type CatalogGalleryImage = {
  mediaId: string
  url: string
}

const galleryImageSchema = z.object({
  mediaId: z.string().min(1).max(64),
  url: z.string().url().max(2048),
})

export const forkCatalogBodySchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  /** Snapshot of effective gallery when leaving linked mode (optional). */
  galleryImages: z.array(galleryImageSchema).max(24).optional(),
})

export const updateCatalogGalleryBodySchema = z.object({
  galleryImages: z.array(galleryImageSchema).max(24),
})

export const updateServiceFormBodySchema = z.object({
  formTemplateId: z.string().length(21).nullable(),
})

export const updateCatalogWebPublishBodySchema = z.object({
  webPublishStatus: webPublishStatusSchema,
})

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

export const shareCatalogItemBodySchema = z
  .object({
    email: z.preprocess(
      emptyToUndefined,
      z.string().trim().email().max(255).optional(),
    ),
    phone: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .min(5)
        .max(32)
        .regex(/^\+?[0-9\s-]{5,31}$/)
        .optional(),
    ),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: 'Enter an email address or a phone number',
    path: ['email'],
  })

export type ShareCatalogItemBody = z.infer<typeof shareCatalogItemBodySchema>

const variantStockLimitQuantitySchema = z.number().min(0).max(999_999_999.999).nullable()

const stockDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const createCompanyProductStockBodySchema = z
  .object({
    quantity: z.coerce.number().positive(),
    batch_number: z.string().trim().min(1).max(255),
    cost_price: z.coerce.number().min(0),
    sell_price: z.coerce.number().min(0),
    purchase_date: stockDateString,
    expired_date: stockDateString.nullable().optional(),
    supplier_user_id: z.string().trim().length(21).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.expired_date && value.expired_date < value.purchase_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expired_date'],
        message: 'Expired date must be on or after purchase date',
      })
    }
  })

export const updateCompanyProductStockBodySchema = createCompanyProductStockBodySchema

export const upsertProductVariantStockLimitsBodySchema = z
  .object({
    minQuantity: variantStockLimitQuantitySchema,
    maxQuantity: variantStockLimitQuantitySchema,
  })
  .refine(
    (data) => {
      if (data.minQuantity != null && data.maxQuantity != null) {
        return data.minQuantity <= data.maxQuantity
      }
      return true
    },
    { message: 'Min quantity cannot exceed max quantity', path: ['maxQuantity'] },
  )

export const replaceServiceWorkflowBodySchema = z.object({
  items: z.array(
    z.object({
      kind: z.enum(['check_in', 'space']).default('space'),
      space_id: z.string().length(21).nullable(),
      staff_ids: z.array(z.string().length(21)),
      form_ids: z.array(z.string().length(21)),
      session_queue: z.boolean().optional().default(false),
      add_items_enabled: z.boolean().optional().default(false),
      add_items_from_library_enabled: z.boolean().optional().default(false),
    }),
  ),
})

export type UpdateCatalogGalleryBody = z.infer<typeof updateCatalogGalleryBodySchema>
export type UpdateServiceFormBody = z.infer<typeof updateServiceFormBodySchema>
export type UpdateCatalogWebPublishBody = z.infer<typeof updateCatalogWebPublishBodySchema>
export type WebPublishStatus = z.infer<typeof webPublishStatusSchema>
export type CreateCompanyProductStockBody = z.infer<typeof createCompanyProductStockBodySchema>
export type UpdateCompanyProductStockBody = z.infer<typeof updateCompanyProductStockBodySchema>
export type UpsertProductVariantStockLimitsBody = z.infer<
  typeof upsertProductVariantStockLimitsBodySchema
>
export type ReplaceServiceWorkflowBody = z.infer<typeof replaceServiceWorkflowBodySchema>
export type ForkCatalogBody = z.infer<typeof forkCatalogBodySchema>

/** Kinds that support a company-owned media gallery on the detail page. */
export const CATALOG_GALLERY_KINDS = ['products', 'services', 'spaces'] as const
export type CatalogGalleryKind = (typeof CATALOG_GALLERY_KINDS)[number]

export function isCatalogGalleryKind(kind: CatalogEntityKind): kind is CatalogGalleryKind {
  return (CATALOG_GALLERY_KINDS as readonly string[]).includes(kind)
}

function sanitizeSellablePayloadAttributes(
  kind: CatalogEntityKind,
  payload: unknown,
): unknown {
  if (kind !== 'products' && kind !== 'services' && kind !== 'spaces') return payload
  if (!payload || typeof payload !== 'object') return payload
  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.attributes)) return payload

  const attributes = record.attributes
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => {
      const attributeId = row.attributeId
      if (typeof attributeId !== 'string' || attributeId.length !== 21) return null

      const textRaw = row.valueText
      const hasText = typeof textRaw === 'string' && textRaw.trim() !== ''
      const numberRaw = row.valueNumber
      const number =
        typeof numberRaw === 'number'
          ? numberRaw
          : typeof numberRaw === 'string' && numberRaw.trim() !== ''
            ? Number(numberRaw)
            : null
      const hasNumber = number != null && Number.isFinite(number)

      if (hasText && !hasNumber) {
        return { attributeId, valueText: textRaw.trim() }
      }
      if (hasNumber && !hasText) {
        return { attributeId, valueNumber: number }
      }
      return null
    })
    .filter((row) => row != null)

  return { ...record, attributes }
}

export function parsePayloadForKind(
  kind: CatalogEntityKind,
  payload: unknown,
): CatalogPayload {
  return catalogPayloadByKind[kind].parse(
    sanitizeSellablePayloadAttributes(kind, payload),
  ) as CatalogPayload
}

export const copyAttributesFromLibraryBodySchema = z.object({
  attributeIds: z.array(z.string().length(21)).min(1),
})

export const copyAttributeValuesFromLibraryBodySchema = z.object({
  libraryValueIds: z.array(z.string().length(21)).min(1),
})

export const copyVariantsFromLibraryBodySchema = z.object({
  libraryVariantIds: z.array(z.string().length(21)).min(1),
})

export const updateCompanyVariantAttributeValuesBodySchema = z.object({
  libraryValueIds: z.array(z.string().length(21)),
})

export const updateCompanyAttributeValueBodySchema = z
  .object({
    valueText: z.string().trim().min(1).max(5000).optional().nullable(),
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

export type CopyAttributesFromLibraryBody = z.infer<typeof copyAttributesFromLibraryBodySchema>
export type CopyAttributeValuesFromLibraryBody = z.infer<typeof copyAttributeValuesFromLibraryBodySchema>
export type CopyVariantsFromLibraryBody = z.infer<typeof copyVariantsFromLibraryBodySchema>
export type UpdateCompanyVariantAttributeValuesBody = z.infer<
  typeof updateCompanyVariantAttributeValuesBodySchema
>
export type UpdateCompanyAttributeValueBody = z.infer<typeof updateCompanyAttributeValueBodySchema>

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
