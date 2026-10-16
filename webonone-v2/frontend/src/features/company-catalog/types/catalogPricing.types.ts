export type CatalogDiscountSchedule = 'all_time' | 'selected_days' | 'date_range'
export type CatalogDiscountAudience = 'everyone' | 'selected_users'
export type CatalogDiscountVariantScope = 'all' | 'selected'

export type CatalogDiscountUser = {
  id: string
  displayName: string
  email: string | null
  avatarUrl: string | null
}

export type CatalogPrice = {
  id: string
  price: number
  isActive: boolean
  createdAt: string
}

export type CatalogDiscountVariant = {
  id: string
  name: string
}

export type CatalogDiscount = {
  id: string
  percent: number
  applyWhen: CatalogDiscountSchedule
  weekdays: number[]
  startDate: string | null
  endDate: string | null
  applyTo: CatalogDiscountAudience
  users: CatalogDiscountUser[]
  applyVariants: CatalogDiscountVariantScope
  variants: CatalogDiscountVariant[]
  createdAt: string
}

export type CatalogPriceKind = 'services' | 'spaces'
export type CatalogDiscountKind = 'products' | CatalogPriceKind
