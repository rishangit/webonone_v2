import { z } from 'zod'

export const saleItemKindSchema = z.enum(['product', 'service', 'space'])
export const salePaymentMethodSchema = z.enum(['cash', 'card', 'other'])
export const saleStatusSchema = z.enum(['draft', 'completed', 'void'])

export const createSaleLineSchema = z
  .object({
    itemKind: saleItemKindSchema,
    catalogItemId: z.string().length(21),
    quantity: z.number().positive().max(1_000_000),
    unitPrice: z.number().min(0).max(99_999_999.99),
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
  customerUserId: z.string().length(21),
  paymentMethod: salePaymentMethodSchema,
  notes: z.string().trim().max(2000).optional().nullable(),
  sessionTokenId: z.string().length(21).optional().nullable(),
  lines: z.array(createSaleLineSchema).min(1).max(100),
})

export const upsertDraftSaleBodySchema = z.object({
  customerUserId: z.string().length(21),
  lines: z.array(createSaleLineSchema).min(1).max(100),
  notes: z.string().trim().max(2000).optional().nullable(),
})

export const completeSaleBodySchema = z.object({
  paymentMethod: salePaymentMethodSchema,
  notes: z.string().trim().max(2000).optional().nullable(),
})

export type CreateSaleBody = z.infer<typeof createSaleBodySchema>
export type UpsertDraftSaleBody = z.infer<typeof upsertDraftSaleBodySchema>
export type CompleteSaleBody = z.infer<typeof completeSaleBodySchema>
export type CreateSaleLine = z.infer<typeof createSaleLineSchema>
export type SaleItemKind = z.infer<typeof saleItemKindSchema>
export type SalePaymentMethod = z.infer<typeof salePaymentMethodSchema>
export type SaleStatus = z.infer<typeof saleStatusSchema>
