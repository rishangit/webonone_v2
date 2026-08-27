import { z } from 'zod'

const dateString = z
  .string()
  .trim()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const stockFormSchema = z
  .object({
    quantity: z.coerce
      .number({ invalid_type_error: 'Quantity is required' })
      .positive('Quantity must be greater than 0'),
    batchNumber: z.string().trim().min(1, 'Batch number is required').max(255),
    costPrice: z.coerce
      .number({ invalid_type_error: 'Cost price is required' })
      .min(0, 'Cost price must be 0 or greater'),
    sellPrice: z.coerce
      .number({ invalid_type_error: 'Sell price is required' })
      .min(0, 'Sell price must be 0 or greater'),
    purchaseDate: dateString,
    expiredDate: z.union([dateString, z.literal('')]).optional(),
    supplierUserId: z.union([z.literal(''), z.string().trim().length(21)]).optional(),
    supplierDisplayName: z.union([z.literal(''), z.string().trim().max(255)]).optional(),
    supplierEmail: z.union([z.string().trim().email().max(255), z.literal('')]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.expiredDate && value.expiredDate !== '' && value.expiredDate < value.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiredDate'],
        message: 'Expired date must be on or after purchase date',
      })
    }

    const hasSupplierId = Boolean(value.supplierUserId && value.supplierUserId !== '')
    const hasSupplierName = Boolean(value.supplierDisplayName && value.supplierDisplayName !== '')
    if (hasSupplierId !== hasSupplierName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplierUserId'],
        message: 'Supplier user and display name must both be provided',
      })
    }
  })

export type StockFormValues = z.infer<typeof stockFormSchema>

export type StockFormDraft = {
  quantity: string
  batchNumber: string
  costPrice: string
  sellPrice: string
  purchaseDate: string
  expiredDate: string
  supplierUserId: string
  supplierDisplayName: string
  supplierEmail: string
}

export function createEmptyStockFormDraft(): StockFormDraft {
  return {
    quantity: '',
    batchNumber: '',
    costPrice: '',
    sellPrice: '',
    purchaseDate: '',
    expiredDate: '',
    supplierUserId: '',
    supplierDisplayName: '',
    supplierEmail: '',
  }
}

export function toCreateStockPayload(values: StockFormValues) {
  const hasSupplier = Boolean(values.supplierUserId && values.supplierUserId !== '')

  return {
    quantity: values.quantity,
    batch_number: values.batchNumber,
    cost_price: values.costPrice,
    sell_price: values.sellPrice,
    purchase_date: values.purchaseDate,
    expired_date: values.expiredDate && values.expiredDate !== '' ? values.expiredDate : null,
    supplier_user_id: hasSupplier ? values.supplierUserId! : null,
    supplier_display_name: hasSupplier ? values.supplierDisplayName! : null,
    supplier_email:
      hasSupplier && values.supplierEmail && values.supplierEmail !== '' ? values.supplierEmail : null,
  }
}
