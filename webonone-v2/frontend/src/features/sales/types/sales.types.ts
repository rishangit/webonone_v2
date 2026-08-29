export type SaleItemKind = 'product' | 'service' | 'space'
export type SalePaymentMethod = 'cash' | 'card' | 'other'
export type SaleStatus = 'draft' | 'completed' | 'void'

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
  billNumber: string | null
  customerUserId: string
  customerDisplayName: string
  customerEmail: string | null
  status: SaleStatus
  paymentMethod: SalePaymentMethod | null
  currency: string
  subtotal: number
  total: number
  notes: string | null
  sessionTokenId: string | null
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
  sessionTokenId?: string | null
  lines: CreateSaleLineBody[]
}

export type UpsertDraftSaleBody = {
  customerUserId: string
  lines: CreateSaleLineBody[]
}

export type CompleteSaleBody = {
  paymentMethod: SalePaymentMethod
  notes?: string | null
}

export type TokenPosSubject = {
  id: string
  userId: string
  userDisplayName: string
  userEmail?: string | null
  tokenLabel?: string
}

export type PosCartLine = {
  key: string
  itemKind: SaleItemKind
  catalogItemId: string
  name: string
  quantity: number
  unitPrice: number
}
