export type SaleItemKind = 'product' | 'service' | 'space'
export type SalePaymentMethod = 'cash' | 'card' | 'other'
export type SaleStatus = 'completed' | 'void'

export type SaleLine = {
  id: string
  lineNo: number
  itemKind: SaleItemKind
  catalogItemId: string
  libraryEntityId: string | null
  name: string
  variantName: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type Sale = {
  id: string
  companyId: string
  billNumber: string
  customerUserId: string
  customerDisplayName: string
  customerEmail: string | null
  status: SaleStatus
  paymentMethod: SalePaymentMethod
  currency: string
  subtotal: number
  total: number
  notes: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  lines: SaleLine[]
}

export type SaleListItem = Omit<Sale, 'lines'>

export type CreateSaleLineBody = {
  itemKind: SaleItemKind
  catalogItemId: string
  quantity: number
  unitPrice: number
}

export type CreateSaleBody = {
  customerUserId: string
  paymentMethod: SalePaymentMethod
  notes?: string | null
  lines: CreateSaleLineBody[]
}

export type PosCartLine = {
  key: string
  itemKind: SaleItemKind
  catalogItemId: string
  name: string
  quantity: number
  unitPrice: number
}
