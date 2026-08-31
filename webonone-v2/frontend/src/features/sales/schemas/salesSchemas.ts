import { z } from 'zod'

export const saleItemKindSchema = z.enum(['product', 'service', 'space'])
export const salePaymentMethodSchema = z.enum(['cash', 'card', 'other'])

export const createSaleLineSchema = z
  .object({
    itemKind: saleItemKindSchema,
    catalogItemId: z.string().length(21, 'Catalog item is required'),
    quantity: z.number({ invalid_type_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
    unitPrice: z
      .number({ invalid_type_error: 'Unit price is required' })
      .min(0, 'Unit price must be 0 or greater'),
    libraryVariantId: z.string().length(21).optional(),
    libraryStockId: z.string().length(21).optional(),
  })
  .superRefine((value, ctx) => {
    const hasVariant = value.libraryVariantId != null
    const hasStock = value.libraryStockId != null
    if (hasVariant !== hasStock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['libraryVariantId'],
        message: 'Variant and stock must both be provided for stocked product lines',
      })
    }
    if ((hasVariant || hasStock) && value.itemKind !== 'product') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['libraryVariantId'],
        message: 'Stock linkage is only supported for product lines',
      })
    }
  })

export const createSaleBodySchema = z.object({
  customerUserId: z.string().length(21, 'Customer is required'),
  paymentMethod: salePaymentMethodSchema,
  notes: z.string().trim().max(2000).optional().nullable(),
  sessionTokenId: z.string().length(21).optional().nullable(),
  lines: z.array(createSaleLineSchema).min(1, 'Add at least one item'),
})

export const upsertDraftSaleBodySchema = z.object({
  customerUserId: z.string().length(21, 'Customer is required'),
  lines: z.array(createSaleLineSchema).min(1, 'Add at least one item'),
})

export const completeSaleBodySchema = z.object({
  paymentMethod: salePaymentMethodSchema,
  notes: z.string().trim().max(2000).optional().nullable(),
})

export const posNewCustomerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email('Enter a valid email').max(255).optional(),
  ),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+\d{7,15}$/, 'Phone must include country code (e.g. +94771234567)'),
})

export type PosNewCustomerValues = z.infer<typeof posNewCustomerSchema>
