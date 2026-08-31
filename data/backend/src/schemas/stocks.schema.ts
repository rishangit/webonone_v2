import { z } from 'zod'

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const createStockBodySchema = z
  .object({
    quantity: z.coerce.number().positive(),
    batch_number: z.string().trim().min(1).max(255),
    cost_price: z.coerce.number().min(0),
    sell_price: z.coerce.number().min(0),
    purchase_date: dateString,
    expired_date: dateString.nullable().optional(),
    supplier_user_id: z.string().trim().length(21).nullable().optional(),
    supplier_display_name: z.string().trim().min(1).max(255).nullable().optional(),
    supplier_email: z.string().trim().email().max(255).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.expired_date && value.expired_date < value.purchase_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expired_date'],
        message: 'Expired date must be on or after purchase date',
      })
    }

    const hasSupplierId = value.supplier_user_id != null && value.supplier_user_id !== ''
    const hasSupplierName = value.supplier_display_name != null && value.supplier_display_name !== ''
    if (hasSupplierId !== hasSupplierName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplier_user_id'],
        message: 'Supplier user and display name must both be provided',
      })
    }
  })

export type CreateStockBody = z.infer<typeof createStockBodySchema>

export const consumeStockBodySchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
})

export type ConsumeStockBody = z.infer<typeof consumeStockBodySchema>
